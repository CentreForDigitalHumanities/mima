import { Injectable, OnDestroy } from '@angular/core';
import { ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, Subscription, combineLatestWith, map, skip } from 'rxjs';
import { State as QuestionnaireState } from '../questionnaire.state';
import { State as JudgmentsState } from '../judgments.state';
import { Filter, FilterField, FilterObject, FilterObjectName, FilterOperator } from '../models/filter';
import { Question } from '../models/question';
import { QuestionnaireService } from './questionnaire.service';
import { Judgment } from '../models/judgment';
import { JudgmentsService } from './judgments.service';
import { DialectService } from './dialect.service';

export interface DropdownOption {
    label: string;
    value: string;
}

export interface FilterFieldOptions {
    labels: { [value: string]: string },
    options: DropdownOption[]
}

type FieldCache<T extends FilterObjectName> = {
    [key in FilterField<T>]?: FilterFieldOptions
};

const fullMatchPrefix = '$';
const negativePrefix = '-';
const operatorField = 'OP';
const valueSeparator = ',';
const valueQuote = '"';

@Injectable({
    providedIn: 'root'
})
export class FilterManagementService implements OnDestroy {
    private subscription: Subscription;

    queryParams$: {
        [T in FilterObjectName]: Observable<{ [fieldName: string]: string }>
    };

    private data: {
        [T in FilterObjectName]: {
            fieldCache?: FieldCache<T>,
            /**
             * Used to check whether the current cache content is still current.
             */
            objects?: ReadonlyMap<string, FilterObject<T>>
        }
    } = {
            question: {},
            judgment: {}
        };

    constructor(private store: Store<QuestionnaireState & JudgmentsState>, private questionnaireService: QuestionnaireService, private judgmentsService: JudgmentsService, private dialectService: DialectService) {
        this.subscription = new Subscription();
        this.queryParams$ = {
            question: this.selectQueryParams(this.subscription, 'question', 'questionnaire', 'questions'),
            judgment: this.selectQueryParams(this.subscription, 'judgment', 'judgments', 'judgments')
        };
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    private selectQueryParams<
        TKey extends keyof (QuestionnaireState & JudgmentsState),
        TItemsKey extends keyof (QuestionnaireState & JudgmentsState)[TKey],
        TType extends FilterObjectName
    >(subscription: Subscription, type: TType, key: TKey, itemsKey: TItemsKey) {
        // make sure it always emits a value when subscribed (e.g. when entering the page)
        const subject = new BehaviorSubject({});
        subscription.add(this.store.select(key, 'filters').pipe(
            skip(1),
            combineLatestWith(
                this.store.select(key, 'operator'),
                this.store.select(key, itemsKey).pipe(
                    // skip the initial empty set and wait for actual results
                    skip(1)
                )),
            map(([filters, operator, objects]) => this.toQueryParams(
                type,
                operator,
                <Filter<TType>[]>filters,
                <ReadonlyMap<string, FilterObject<TType>>>objects)))
            .subscribe(values => {
                subject.next(values);
            }));

        return subject.asObservable();
    }
    /**
     * Encodes the filters for placement in the URL
     * @param operator operator used for combining the filters
     * @param filters list of filters
     * @param questions questions database
     * @returns querystring parameters
     */
    toQueryParams<T extends FilterObjectName>(type: T, operator: FilterOperator, filters: readonly Filter<T>[], questions: ReadonlyMap<string, FilterObject<T>>): { [fieldName: string]: string } {
        if (!filters) {
            return {};
        }

        let queryParams: { [fieldName: string]: string } = {};

        let empty = true;
        for (const filter of filters) {
            if (empty && filter.content.find(c => !!c?.trim())) {
                empty = false;
            }

            const { negative, content } = this.negativeFilter(type, filter, questions);

            queryParams[this.toParamKey(filter, negative, queryParams)] = this.toParamValue(content);
        }

        if (filters.length > 1) {
            queryParams[operatorField] = operator;
        }

        if (empty) {
            return {};
        }

        return queryParams;
    }

    /**
     * Decodes the filters from the URL
     * @param queryParams querystring parameters
     * @param objects objects database
     * @returns list of filters and operator
     */
    fromQueryParams<T extends FilterObjectName>(type: T, queryParams: ParamMap, objects: ReadonlyMap<string, FilterObject<T>>): [FilterOperator, Filter<T>[]] {
        let operator: FilterOperator = 'and';
        const filters: Filter<T>[] = [];
        for (const key of queryParams.keys) {
            if (key === operatorField) {
                operator = <FilterOperator>queryParams.get(key);
            } else {
                const { onlyFullMatch, negative, field } = this.fromParamKey(key);

                let content = queryParams.getAll(key).reduce<string[]>((prev, current) => [
                    ...prev,
                    ...this.fromParamValue(current)
                ], []);

                if (negative) {
                    // the value contains the content which should be excluded
                    const included = new Set(this.filterFieldOptions(type, field, objects).options.map(option => option.value));
                    for (const excluded of content) {
                        included.delete(excluded);
                    }
                    content = [...included];
                }

                filters.push({
                    content,
                    field,
                    index: filters.length,
                    onlyFullMatch
                });
            }
        }

        return [operator, filters];
    }

    private fromParamKey<T extends FilterObjectName = any>(key: string): { field: FilterField<T>, onlyFullMatch: boolean, negative: boolean } {
        let onlyFullMatch = false;
        let negative = false;
        if (key.startsWith(fullMatchPrefix)) {
            onlyFullMatch = true;
        }
        if (key.startsWith(negativePrefix, onlyFullMatch ? 1 : 0)) {
            negative = true;
        }

        return {
            field: <FilterField<T>>key.substring((onlyFullMatch ? 1 : 0) + (negative ? 1 : 0)).replace(/\d+$/, ''),
            onlyFullMatch,
            negative
        };
    }

    private toParamKey(filter: Filter<any>, negative: boolean, queryParams: { [fieldName: string]: string }): string {
        const fieldName = `${filter.onlyFullMatch ? fullMatchPrefix : ''}${negative ? negativePrefix : ''}${filter.field}`;

        let suffix = '';
        let i = 0;
        while ((fieldName + suffix) in queryParams) {
            suffix = `${i}`;
        }

        return fieldName + suffix;
    }

    /**
     * Determines whether the filter should be negative and what fields should be excluded.
     * @param filter filter to check
     * @param questions questions, used to look for the options
     * @returns whether this filter could be more compactly written as excluding values instead of including them
     */
    private negativeFilter<T extends FilterObjectName>(type: T, filter: Filter<T>, questions: ReadonlyMap<string, FilterObject<T>>): { negative: boolean, content: string[] } {
        if (filter.onlyFullMatch && filter.field !== '*') {
            const options = this.filterFieldOptions(type, filter.field, questions);
            if (options.options.length - filter.content.length < filter.content.length) {
                return { negative: true, content: Array.from(this.excludeFrom(options.options.map(o => o.value), filter.content)) };
            }
        }

        return { negative: false, content: filter.content };
    }

    private *excludeFrom(items: string[], remove: string[]): Iterable<string> {
        for (const option of items) {
            if (remove.indexOf(option) == -1) {
                yield option;
            }
        }
    }

    /**
     * Encodes a list of string values to a single query string value
     */
    toParamValue(values: string[]): string {
        return values.map(item => item.indexOf(valueSeparator) >= 0 || item.indexOf(valueQuote) >= 0
            ? `${valueQuote}${item.replaceAll(valueQuote, valueQuote + valueQuote)}${valueQuote}`
            : item).join(valueSeparator);
    }

    /**
     * Decodes a query string value to a list of string values
     */
    fromParamValue(value: string): string[] {
        const values: string[] = [];
        let current = '';
        let quoted = false;
        // encountered a quote
        let singleQuote = false;
        for (const c of value) {
            switch (c) {
                case valueQuote:
                    if (!quoted && current.length == 0) {
                        // start of a quoted value
                        quoted = true;
                    } else if (singleQuote) {
                        // double quotes? these were escaped
                        current += c;
                        singleQuote = false;
                    } else {
                        singleQuote = true;
                    }
                    break;

                case valueSeparator:
                    if (!quoted || singleQuote) {
                        // loose quote? end the escaping!
                        values.push(current);
                        current = '';
                        quoted = false;
                        singleQuote = false;
                    } else {
                        current += c;
                    }
                    break;

                default:
                    current += c;
                    break;
            }
        }

        if (values.length || current !== '') {
            // if there is only an empty value, don't set it to prevent selecting
            // a non-existent empty value in a drop down
            values.push(current);
        }
        return values;
    }

    /**
     * Gets the options which can be selected for a filter on a field.
     * @param field field to filter
     * @param objects the objects to filter, mapped by ID
     * @returns drop down options for a value selector
     */
    filterFieldOptions<T extends FilterObjectName>(type: T, field: FilterField<T>, objects: ReadonlyMap<string, FilterObject<T>>): FilterFieldOptions {
        if (this.data[type].objects !== objects) {
            this.data[type].objects = objects;
            this.data[type].fieldCache = {};
        }

        if (field in this.data[type].fieldCache) {
            return this.data[type].fieldCache[field];
        }

        let labels: { [value: string]: string } = {};
        switch (type) {
            case 'question':
                labels = this.filterFieldOptionsQuestion(<FilterField<'question'>>field, <ReadonlyMap<string, Question>>objects);
                break;

            case 'judgment':
                labels = this.filterFieldOptionsJudgments(<FilterField<'judgment'>>field, <ReadonlyMap<string, Judgment>>objects);
                break;

            default:
                throw `Missing implementation for ${type}`;
        }
        const options = this.labelsToOptions(labels);

        this.data[type].fieldCache[field] = options;

        return options;
    }

    /**
     * Gets the options for judgments which can be selected for a filter on a field.
     * @param field field to filter
     * @param questions the questions to filter, mapped by ID
     * @returns drop down options for a value selector
     */
    private filterFieldOptionsQuestion(field: FilterField<'question'>, questions: ReadonlyMap<string, Question>) {
        let labels: { [value: string]: string } = {};
        if (field == 'attestation') {
            labels = { 'unattested': $localize`unattested`, 'attested': $localize`attested` }
        } else {
            for (const [id, question] of questions) {
                switch (field) {
                    case '*':
                        break;

                    case 'dialects':
                        // TODO: these should be synchronized: the dialect hierarchy and the data
                        // in the answers should be the same
                        for (const dialect of this.dialectService.dialectLookup.flattened) {
                            labels[dialect.name] = dialect.name;
                        }
                        // for (let answer of question.answers) {
                        //     for (const value of answer[field]) {
                        //         labels[value] = value;
                        //     }
                        // }
                        break;

                    case 'id':
                        labels[id] = question.prompt;
                        break;

                    case 'participantId':
                        for (let participant of this.questionnaireService.getParticipants(question.answers)) {
                            labels[participant.participantId] = `${participant.participantId} ${participant.dialects[0]}`; // just using the first one for now
                        }

                        break;

                    case 'subtags':
                        if (question.subtags) {
                            for (let subtag of question.subtags) {
                                if (subtag) {
                                    labels[subtag] = subtag;
                                }
                            }
                        }
                        break;

                    default:
                        labels[question[field]] = question[field];
                        break;
                }
            }
        }

        return labels;
    }

    /**
     * Gets the options for judgments which can be selected for a filter on a field.
     * @param field field to filter
     * @param judgments the judgments to filter, mapped by ID
     * @returns drop down options for a value selector
     */
    private filterFieldOptionsJudgments(field: FilterField<'judgment'>, judgments: ReadonlyMap<string, Judgment>) {
        let labels: { [value: string]: string } = {};
        let subQuestions: { [id: string]: string } = {};
        for (const [id, judgment] of judgments) {
            switch (field) {
                case '*':
                    break;

                case 'dialects':
                    for (let response of judgment.responses) {
                        for (const value of response[field]) {
                            labels[value] = value;
                        }
                    }
                    break;

                case 'judgmentId':
                    labels[id] = judgment.mainQuestion + ' - ' + judgment.subQuestion;
                    break;

                case 'participantId':
                    for (let participant of this.judgmentsService.getParticipants(judgment.responses)) {
                        labels[participant.participantId] = `${participant.participantId} ${participant.dialects[0]}`; // just using the first one for now
                    }

                    break;

                case 'mainQuestionId':
                    labels[judgment.mainQuestionId] = `[${judgment.mainQuestionId}] ${judgment.mainQuestion}`;
                    break;

                case 'subQuestionTextId':
                    subQuestions[judgment.subQuestionTextId] = judgment.subQuestion;
                    break;

                case 'responses':
                    // not used
                    break;

                default:
                    for (let score = 1; score <= 5; score++) {
                        labels[`${score}`] = `${score}`;
                    }
                    break;
            }
        }

        for (let [id, text] of Object.entries(subQuestions)) {
            labels[id] = `[${id}] ${text}`;
        }

        return labels;
    }

    private labelsToOptions(labels: { [value: string]: string }): FilterFieldOptions {
        return {
            labels,
            options: Object.entries(labels).sort(([x, a], [y, b]) => {
                if (a < b) {
                    return -1;
                } else if (a > b) {
                    return 1;
                }
                return 0;
            }).map<DropdownOption>(([value, label]) => ({
                value,
                label
            }))
        };
    }
}
