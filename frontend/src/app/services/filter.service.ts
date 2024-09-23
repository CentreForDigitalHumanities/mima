import { Injectable } from '@angular/core';
import { MatchedParts } from '../models/matched-parts';
import { Filter, FilterField, FilterMatchedObject, FilterObject, FilterObjectName, FilterOperator } from '../models/filter';
import { MatchedQuestion, MatchedQuestionDeserialized, MatchedQuestionProperties, Question } from '../models/question';
import { Answer, MatchedAnswer, MatchedAnswerDeserializedProperties, MatchedAnswerProperties } from '../models/answer';
import { SearchExpression, ignoreCharactersExp } from '../models/search-expression';
import { Judgment, MatchedJudgment, MatchedJudgmentDeserialized, MatchedJudgmentProperties } from '../models/judgment';
import { LikertResponse, MatchedLikertResponse } from '../models/likert-response';


export function isAnswer(object: any): object is Answer | MatchedAnswer | MatchedAnswerProperties | MatchedAnswerDeserializedProperties {
    return (object as Answer).answerId !== undefined;
}

export function isQuestion(object: any): object is Question | MatchedQuestion | MatchedQuestionProperties | MatchedQuestionDeserialized {
    return (object as Question).id !== undefined;
}

export function isJudgment(object: any): object is Judgment | MatchedJudgment | MatchedJudgmentProperties | MatchedJudgmentDeserialized {
    return (object as Judgment).judgmentId !== undefined;
}

export function isDefaultFilter(filter: Filter<any>) {
    return filter &&
        filter.field === '*' &&
        filter.content.length <= 1 &&
        !filter.content[0]?.trim()
}

export function isEmptyFilter(filter: Filter<any>) {
    return filter && !filter.content.find(val => !!val.trim());
}

@Injectable({
    providedIn: 'root'
})
export class FilterService {

    /**
     * @returns MatchedQuestion or MatchedJudgment, or undefined if it doesn't match
     */
    public applyFilters<T extends FilterObjectName>(item: FilterObject<T>, filters: ReadonlyArray<Filter<T>>, operator: FilterOperator): FilterMatchedObject<T> {
        let subMatch = false;
        let itemMatch = false;
        let keys: (keyof FilterObject<T>)[] = [];
        const matchingFilters: Filter<T>[] = [];
        let result: FilterMatchedObject<T>;

        if (isJudgment(item)) {
            result = <FilterMatchedObject<T>>new MatchedJudgment();
            keys = <(keyof FilterObject<T>)[]><(keyof Judgment)[]>[
                'judgmentId',
                'mainQuestion',
                'mainQuestionId',
                'responses',
                'subQuestion',
                'subQuestionId'
            ];
        } else if (isQuestion(item)) {
            result = <FilterMatchedObject<T>>new MatchedQuestion();
            keys = <(keyof FilterObject<T>)[]><(keyof Question)[]>[
                'id',
                'prompt',
                'split_item',
                'answers',
                'chapter',
                'subtags',
                'gloss',
                'en_translation',
            ];
        }

        for (const key of keys) {
            [itemMatch, subMatch] = this.detectMatches(item, result, filters, key, itemMatch, subMatch, matchingFilters, operator);
        }
        if (itemMatch || subMatch) {
            if (operator === 'and') {
                // check whether all the filters matched
                if (filters.length !== new Set(matchingFilters).size) {
                    return undefined;
                }
            }

            if (itemMatch) {
                if (isQuestion(item)) {
                    // if the question itself matches,
                    // that means ALL answers should be shown
                    for (const answer of (<MatchedQuestion>result).answers) {
                        answer.match = true;
                    }
                } else if (isJudgment(item)) {
                    // if the judgment itself matches,
                    // that means ALL responses should be shown
                    for (const response of (<MatchedJudgment>result).responses) {
                        response.match = true;
                    }

                }
            }

            result.updateCounts();

            return result;
        }


        return undefined;
    }

    /**
     * Checks whether the filters are equivalent and should return the same results.
     * @param current current filters
     * @param updated updated filters
     * @returns true if the filters differ
     */
    public differ(current: readonly Filter<any>[], updated: readonly Filter<any>[]): boolean {
        if (current.length !== updated.length) {
            return true;
        }

        for (let i = 0; i < current.length; i++) {
            const c = current[i];
            const u = updated[i];

            if (this.empty(c) && this.empty(u)) {
                continue;
            }

            if (c.field !== u.field) {
                return true;
            }

            if (c.content.length !== u.content.length) {
                return true;
            }

            for (let j = 0; j < c.content.length; j++) {
                if (c.content[j] !== u.content[j]) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Checks if a filter is empty.
     */
    private empty(filter: Filter<any>): boolean {
        return !(filter.content[0] ?? '').trim();
    }

    /**
     * Detect matches for a certain field of Adverbial/Question, either a string field or an array field
     * @param object Adverbial object in which to detect matches
     * @param result MatchedAdverbial object in which to update the matches
     * @param filters filters to apply
     * @param key name of the field
     * @param itemMatch boolean, if any match is present on the question or judgment itself
     * @param subMatch boolean, if any match is present on underlying answers, tags or responses
     * @param matchingFilters List of matching filters
     * @param operator should ALL or ANY of the filters match?
     * @returns itemMatch (boolean), anyMatch (boolean)
     */
    private detectMatches<T extends FilterObjectName>(
        object: FilterObject<T>,
        result: FilterMatchedObject<T>,
        filters: ReadonlyArray<Filter<T>>,
        key: keyof FilterObject<T>,
        itemMatch: boolean,
        subMatch: boolean,
        matchingFilters: Filter<T>[],
        operator: FilterOperator)
        : [boolean, boolean] {
        switch (key) {
            case 'id':
            case 'prompt':
            case 'question':
            case 'type':
            case 'chapter':
            case 'gloss':
            case 'en_translation':
            case 'split_item':
            case 'judgmentId':
            case 'mainQuestion':
            case 'mainQuestionId':
            case 'subQuestion':
            case 'subQuestionId':
                {
                    const value = object[key];
                    const [parts, partFilters] = this.searchField<T>(<string>value, <any>key, filters);
                    result[<any>key] = parts;
                    itemMatch ||= parts.match;
                    matchingFilters.push(...<any>partFilters);
                }
                break;
            case 'subtags':
                {
                    result[<any>key] = [];
                    const subtags = (<Question>object).subtags;
                    if (subtags) {
                        for (const subtag of subtags) {
                            const [parts, partFilters] = this.searchField(subtag, <any>key, filters);
                            // matching subtags also count as matching the entire question
                            itemMatch ||= parts.match;
                            subMatch ||= parts.match;
                            result[<any>key].push(parts);
                            matchingFilters.push(...<any>partFilters);
                        }
                    }
                }
                break;
            case 'answers':
                {
                    result[<any>key] = [];
                    const question = object;
                    const answers = (<Question>question).answers;

                    const answerKeys: (keyof Answer)[] = [
                        'answer',
                        'dialect',
                        'participantId',
                        'attestation'
                    ];
                    const answerFilters = filters.filter(
                        filter => ['*', ...answerKeys].includes(filter.field));
                    for (const answer of answers) {
                        const [matchedAnswer, matchingAnswerFilters] = this.searchSub(answer, answerKeys, answerFilters, operator);
                        subMatch ||= matchedAnswer.match;
                        result[<any>key].push(matchedAnswer);
                        matchingFilters.push(...<any>matchingAnswerFilters);
                    }
                }
                break;

            case 'responses':
                {
                    result[<any>key] = [];
                    const judgment = object;
                    const responses = (<Judgment>judgment).responses;

                    const responseKeys: (keyof LikertResponse)[] = [
                        'participantId',
                        'dialect',
                        'score'
                    ];
                    const responseFilters = filters.filter(
                        filter => ['*', ...responseKeys].includes(filter.field));
                    for (const response of responses) {
                        const [matchedResponse, matchingResponseFilters] = this.searchSub(response, responseKeys, responseFilters, operator);
                        subMatch ||= matchedResponse.match;
                        result[<any>key].push(matchedResponse);
                        matchingFilters.push(...<any>matchingResponseFilters);
                    }
                }
                break;
        }

        return [itemMatch, subMatch];
    }

    /**
     * Searches an answer or response for matches on the passed filters.
     * @param item item containing the fields to search through
     * @param itemKeys keys of the fields to search
     * @param itemFilters filters to use
     * @param operator whether ALL or ANY of the filters should match
     * @returns the MatchedAnswer or MatchedLikertResponse containing information about the matches (if any), and the matching filters
     */
    private searchSub<T extends FilterObjectName, TSub extends Answer | LikertResponse>(item: TSub, itemKeys: (keyof TSub)[], itemFilters: Filter<T>[], operator: FilterOperator): [TSub extends Answer ? MatchedAnswer : MatchedLikertResponse, Set<Filter<T>>] {
        const matchedSub = isAnswer(item) ? new MatchedAnswer(item) : new MatchedLikertResponse(item);
        let matchingFilters = new Set<Filter<T>>();
        for (const itemKey of itemKeys) {
            const [parts, partFilters] = this.searchField<any>(item[itemKey]?.toString(), itemKey, itemFilters);
            matchedSub[<any>itemKey] = parts;
            for (const filter of partFilters) {
                matchingFilters.add(filter);
            }
        }

        if (itemFilters.length) {
            if (operator === 'or') {
                matchedSub.match = matchingFilters.size > 0;
            } else {
                // AND operator: all filters should match
                matchedSub.match = matchingFilters.size === itemFilters.length;
                if (!matchedSub.match) {
                    matchingFilters = new Set<Filter<T>>();
                }
            }
        }

        return [<any>matchedSub, matchingFilters];
    }

    /**
     * Search a single field using filters
     * @param text field text to search
     * @param field name of the field
     * @param filters filters to apply
     * @returns [MatchedParts, Set<Filter>] matched parts and the matching filter
     */
    private searchField<T extends FilterObjectName>(text: string, field: FilterField<T>, filters: ReadonlyArray<Filter<T>>): [MatchedParts, Set<Filter<T>>] {
        const matches: [number, number][] = [];
        const matchingFilters = new Set<Filter<T>>();
        let emptyFilter = false;
        let anythingMatched = false;
        if (filters?.length) {
            for (const filter of filters) {
                if (filter.field === '*' || filter.field === field) {
                    const filterMatches = this.searchMultiple(text, filter.content, filter.onlyFullMatch);
                    matches.push(...filterMatches);
                    if (this.empty(filter)) {
                        // an empty filter matches everything!
                        emptyFilter = true;
                        matchingFilters.add(filter);
                    } else if (filterMatches.length) {
                        anythingMatched = true;
                        matchingFilters.add(filter);
                    }
                }
            }
        } else {
            emptyFilter = true;
        }

        const results = new MatchedParts({
            empty: !(text ?? '').trim(),
            parts: [],
            fullMatch: anythingMatched && matches.length > 0,
            match: emptyFilter || matches.length > 0,
            emptyFilters: emptyFilter
        });

        const pushMatch = (subtext: string) => {
            results.parts.push({
                text: subtext,
                match: true
            });
        };

        const pushMiss = (subtext: string) => {
            results.parts.push({
                text: subtext,
                match: false
            });

            if (results.fullMatch && subtext.replace(ignoreCharactersExp, '')) {
                results.fullMatch = false;
            }
        };

        let lastMatchEnd = 0;
        if (matches.length) {
            const mergedMatches = this.mergeMatches(matches);

            // returns the marked string
            for (const [start, end] of mergedMatches) {
                if (start > lastMatchEnd) {
                    pushMiss(text.substring(lastMatchEnd, start));
                }

                pushMatch(text.substring(start, end));

                lastMatchEnd = end;
            }
        }

        if (lastMatchEnd < text.length) {
            pushMiss(text.substring(lastMatchEnd));
        }

        return [results, matchingFilters];
    }

    public mergeMatches(matches: [number, number][]) {
        // sort by start index
        matches.sort((a, b) => a[0] - b[0]);

        const mergedMatches: [number, number][] = [];

        for (const [start, end] of matches) {
            if (mergedMatches.length === 0) {
                // always push the first match
                mergedMatches.push([start, end]);
            } else {
                const mergedIndex = mergedMatches.length - 1;
                const previousEnd = mergedMatches[mergedIndex][1];

                // What can happen?
                // Note: the matches were sorted by their start index!
                if (previousEnd >= start && previousEnd < end) {
                    // 1. the previous match ENDS WITHIN this match
                    mergedMatches[mergedIndex][1] = end;
                }
                else if (previousEnd < start) {
                    // 2. the previous match ENDS BEFORE this match
                    mergedMatches.push([start, end]);
                }
                // 3. the previous match ENDS AFTER this match
                //    do nothing, they overlap!
            }
        }

        return mergedMatches;
    }

    /**
     * For each string in the filter's content,
     * it splits search text by space and matches each separate item
     */
    private searchMultiple(haystack: string, needles: string[], onlyFullMatch: boolean): [number, number][] {
        const results = [];
        for (const needleGroup of needles) {
            if (onlyFullMatch) {
                if (needleGroup == haystack) {
                    return [[0, haystack.length]];
                }
                continue;
            }

            const expression = new SearchExpression(needleGroup);
            results.push(...expression.search(haystack));
        }

        return results;
    }

}
