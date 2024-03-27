import { Injectable } from '@angular/core';
import { MatchedParts } from '../models/matched-parts';
import { Filter, FilterField, FilterOperator } from '../models/filter';
import { MatchedQuestion, Question } from '../models/question';
import { Answer, MatchedAnswer } from '../models/answer';
import { SearchExpression, ignoreCharactersExp } from '../models/search-expression';

function isQuestion(object: object): object is Question {
    return (object as Question).question !== undefined;
}

export function isDefaultFilter(filter: Filter) {
    return filter &&
        filter.field === '*' &&
        filter.content.length <= 1 &&
        !filter.content[0]?.trim()
}

export function isEmptyFilter(filter: Filter) {
    return filter && !filter.content.find(val => !!val.trim());
}

@Injectable({
    providedIn: 'root'
})
export class FilterService {

    /**
     * @returns MatchedQuestion, or undefined if it doesn't match
     */
    public applyFilters(item: Question, filters: ReadonlyArray<Filter>, operator: FilterOperator): MatchedQuestion {
        let anyMatch = false;
        let itemMatch = false;
        let keys: (keyof Question)[] = [];
        const matchingFilters: Filter[] = [];
        const result = new MatchedQuestion();
        keys = [
            'id',
            'prompt',
            'answers',
            'chapter',
            'subtags',
            'gloss',
            'en_translation',
        ];
        for (const key of keys) {
            [itemMatch, anyMatch] = this.detectMatches(item, result, filters, key, itemMatch, anyMatch, matchingFilters, operator);
        }
        if (anyMatch) {
            if (operator === 'and') {
                // check whether all the filters matched
                if (filters.length !== new Set(matchingFilters).size) {
                    return undefined;
                }
            } else if (itemMatch && isQuestion(item)) {
                // if the question itself matches,
                // that means ALL answers should be shown
                for (const answer of result.answers) {
                    answer.match = true;
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
    public differ(current: readonly Filter[], updated: readonly Filter[]): boolean {
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
    private empty(filter: Filter): boolean {
        return !(filter.content[0] ?? '').trim();
    }

    /**
     * Detect matches for a certain field of Adverbial/Question, either a string field or an array field
     * @param object Adverbial object in which to detect matches
     * @param result MatchedAdverbial object in which to update the matches
     * @param filters filters to apply
     * @param key name of the field
     * @param itemMatch boolean, if any match is present on the adverbial or question itself
     * @param anyMatch boolean, if any match is present, including on underlying answers
     * @param matchingFilters List of matching filters
     * @param operator should ALL or ANY of the filters match?
     * @returns itemMatch (boolean), anyMatch (boolean)
     */
    private detectMatches(
        object: Question,
        result: MatchedQuestion,
        filters: ReadonlyArray<Filter>,
        key: keyof Question,
        itemMatch: boolean,
        anyMatch: boolean,
        matchingFilters: Filter[],
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
                {
                    const value = object[key];
                    const [parts, partFilters] = this.searchField(value, key, filters);
                    result[key] = parts;
                    itemMatch ||= parts.match;
                    anyMatch ||= itemMatch;
                    matchingFilters.push(...partFilters);
                }
                break;
            case 'subtags':
                {
                    result[key] = [];
                    const subtags = object.subtags;
                    if (subtags) {
                        for (const subtag of subtags) {
                            const [parts, partFilters] = this.searchField(subtag, key, filters);
                            anyMatch ||= parts.match;
                            result[key].push(parts);
                            matchingFilters.push(...partFilters);
                        }
                    }
                }
                break;
            case 'answers':
                {
                    result[key] = [];
                    const question = object;
                    const answers = question.answers;

                    const answerKeys: (keyof Answer)[] = [
                        'answer',
                        'dialect',
                        'participantId',
                        'attestation'
                    ];
                    const answerFilters = filters.filter(
                        filter => ['*', ...answerKeys].includes(filter.field));
                    for (const answer of answers) {
                        const [matchedAnswer, matchingAnswerFilters] = this.searchAnswer(answer, answerKeys, answerFilters, operator);
                        anyMatch ||= matchedAnswer.match;
                        result[key].push(matchedAnswer);
                        matchingFilters.push(...matchingAnswerFilters);
                    }
                }
                break;
        }

        return [itemMatch, anyMatch];
    }

    /**
     * Searches an answer for matches on the passed filters.
     * @param answer answer containing the fields to search through
     * @param answerKeys keys of the fields to search
     * @param answerFilters filters to use
     * @param operator whether ALL or ANY of the filters should match
     * @returns the MatchedAnswer containing information about the matches (if any), and the matching filters
     */
    private searchAnswer(answer: Answer, answerKeys: (keyof Answer)[], answerFilters: Filter[], operator: FilterOperator): [MatchedAnswer, Set<Filter>] {
        const matchedAnswer = new MatchedAnswer(answer);
        let matchingFilters = new Set<Filter>();
        for (const answerKey of answerKeys) {
            const [parts, partFilters] = this.searchField(answer[answerKey], answerKey, answerFilters);
            matchedAnswer[answerKey] = parts;
            for (const filter of partFilters) {
                matchingFilters.add(filter);
            }
        }

        if (answerFilters.length) {
            if (operator === 'or') {
                matchedAnswer.match = matchingFilters.size > 0;
            } else {
                // AND operator: all filters should match
                matchedAnswer.match = matchingFilters.size === answerFilters.length;
                if (!matchedAnswer.match) {
                    matchingFilters = new Set<Filter>();
                }
            }
        }
        else {
            // no filters should match everything
            matchedAnswer.match = true;
        }

        return [matchedAnswer, matchingFilters];
    }

    /**
     * Search a single field using filters
     * @param text field text to search
     * @param field name of the field
     * @param filters filters to apply
     * @returns [MatchedParts, Set<Filter>] matched parts and the matching filter
     */
    private searchField(text: string, field: FilterField, filters: ReadonlyArray<Filter>): [MatchedParts, Set<Filter>] {
        const matches: [number, number][] = [];
        const matchingFilters = new Set<Filter>();
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
