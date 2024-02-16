import { Injectable } from '@angular/core';
import { ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatestWith, map, skip } from 'rxjs';
import { State } from '../questionnaire.state';
import { Filter, FilterField, FilterOperator } from '../models/filter';
import { Question } from '../models/question';
import { QuestionnaireService } from './questionnaire.service';

export interface DropdownOption {
    label: string;
    value: string;
}

interface FilterFieldOptions {
    labels: { [value: string]: string },
    options: DropdownOption[]
}

const fullMatchPrefix = '$';
const negativePrefix = '-';
const operatorField = 'OP';
const valueSeparator = ',';
const valueQuote = '"';

@Injectable({
    providedIn: 'root'
})
export class FilterManagementService {
    queryParams$: Observable<any>;

    private filterFieldOptionsCache: {
        [key in FilterField]?: FilterFieldOptions
    };

    /**
     * Used to check whether the current cache content is still current.
     */
    private filterFieldQuestions: Map<string, Question>;

    constructor(private store: Store<State>, private questionnaireService: QuestionnaireService) {
        this.queryParams$ = this.store.select('questionnaire', 'filters').pipe(
            skip(1), // skip emitting the initial filters
            combineLatestWith(
                this.store.select('questionnaire', 'operator'),
                this.store.select('questionnaire', 'questions')),
            map(([filters, operator, questions]) => this.toQueryParams(operator, filters, questions)));
    }

    /**
     * Encodes the filters for placement in the URL
     * @param operator operator used for combining the filters
     * @param filters list of filters
     * @param questions questions database
     * @returns querystring parameters
     */
    toQueryParams(operator: FilterOperator, filters: readonly Filter[], questions: Map<string, Question>): { [fieldName: string]: string } {
        if (!filters) {
            return {};
        }

        let queryParams: { [fieldName: string]: string } = {};

        let empty = true;
        for (const filter of filters) {
            if (empty && filter.content.find(c => !!c?.trim())) {
                empty = false;
            }

            const { negative, content } = this.negativeFilter(filter, questions);

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
     * @param questions questions database
     * @returns list of filters and operator
     */
    fromQueryParams(queryParams: ParamMap, questions: Map<string, Question>): [FilterOperator, Filter[]] {
        let operator: FilterOperator = 'and';
        const filters: Filter[] = [];
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
                    const included = new Set(this.filterFieldOptions(field, questions).options.map(option => option.value));
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

    private fromParamKey(key: string): { field: FilterField, onlyFullMatch: boolean, negative: boolean } {
        let onlyFullMatch = false;
        let negative = false;
        if (key.startsWith(fullMatchPrefix)) {
            onlyFullMatch = true;
        }
        if (key.startsWith(negativePrefix, onlyFullMatch ? 1 : 0)) {
            negative = true;
        }

        return {
            field: <FilterField>key.substring((onlyFullMatch ? 1 : 0) + (negative ? 1 : 0)).replace(/\d+$/, ''),
            onlyFullMatch,
            negative
        };
    }

    private toParamKey(filter: Filter, negative: boolean, queryParams: { [fieldName: string]: string }): string {
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
    private negativeFilter(filter: Filter, questions: Map<string, Question>): { negative: boolean, content: string[] } {
        if (filter.onlyFullMatch && filter.field !== '*') {
            const options = this.filterFieldOptions(filter.field, questions);
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
     * @param questions the questions to filter, mapped by ID
     * @returns drop down options for a value selector
     */
    filterFieldOptions(field: FilterField, questions: Map<string, Question>): FilterFieldOptions {
        if (this.filterFieldQuestions !== questions) {
            this.filterFieldQuestions = questions;
            this.filterFieldOptionsCache = {};
        }

        if (field in this.filterFieldOptionsCache) {
            return this.filterFieldOptionsCache[field];
        }

        let labels: { [value: string]: string } = {};
        if (field == 'attestation') {
            labels = {'unattested': $localize`unattested`, 'attested': $localize`attested`}
        } else {
            for (const [id, question] of questions) {
                switch (field) {
                    case '*':
                        break;

                    case 'dialect':
                        for (let answer of question.answers) {
                            labels[answer[field]] = answer[field];
                        }
                        break;

                    case 'id':
                        labels[id] = question.prompt;
                        break;

                    case 'participantId':
                        for (let participant of this.questionnaireService.getParticipants(question.answers)) {
                            labels[participant.participantId] = `${participant.participantId} ${participant.dialect}`;
                        }

                        break;

                    default:
                        labels[question[field]] = question[field];
                        break;
                }
            }
        }


        const result = {
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

        this.filterFieldOptionsCache[field] = result;

        return result;
    }
}
