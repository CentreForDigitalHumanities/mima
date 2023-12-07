import { Injectable } from '@angular/core';
import { Adverbial, MatchedAdverbial, MatchedParts } from '../models/adverbial';
import { Filter, FilterField, FilterOperator } from '../models/filter';
import { MatchedQuestion, Question } from '../models/question';
import { Answer, MatchedAnswer } from '../models/answer';


const ignoreCharacters = ['-', '\'', '.', ',', '(', ')'];
const ignoreCharactersExp = /[\-'\.\,\(\)\s]/g;

// https://stackoverflow.com/a/37511463/8438971
function removeDiacritics(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

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
     * @returns MatchedAdverbial|MatchedQuestion, or undefined if it doesn't match
     */
    public applyFilters<T extends Adverbial | Question>(item: T, filters: ReadonlyArray<Filter>, operator: FilterOperator):
        T extends Adverbial ? MatchedAdverbial : MatchedQuestion {
        let anyMatch = false;
        let result: MatchedQuestion | MatchedAdverbial;
        let keys: (keyof MatchedQuestion)[] | (keyof MatchedAdverbial)[] = [];
        const matchingFilters: Filter[] = [];
        if (isQuestion(item)) {
            result = new MatchedQuestion();
            keys = [
                'id',
                'prompt',
                'answers'
            ];
        } else {
            result = new MatchedAdverbial();
            keys = [
                'id',
                'text',
                'roots',
                'examples',
                'translations',
                'glosses',
                'language',
                'dialect',
                'language_family',
                'language_group',
                'source',
                'labels',
                'notes'];
        }
        for (const key of keys) {
            [result[key], anyMatch] = this.detectMatches(item, result, filters, key, anyMatch, matchingFilters);
        }
        if (anyMatch) {
            if (operator === 'and') {
                // check whether all the filters matched
                for (const filter of filters) {
                    if (matchingFilters.indexOf(filter) === -1) {
                        return undefined;
                    }
                }
            }

            return <T extends Adverbial ? MatchedAdverbial : MatchedQuestion>result;
        }


        return undefined;
    }

    /**
     * Detect matches for a certain field of Adverbial,
     * either a string field or an array field
     * @param object Adverbial object in which to detect matches
     * @param result MatchedAdverbial object in which to update the matches
     * @param filters filters to apply
     * @param key name of the field
     * @param anyMatch boolean, if any match is present
     * @param matchingFilters List of matching filters
     * @returns MatchedParts or MatchedParts[], anyMatch (boolean)
     */
    private detectMatches<T extends Adverbial | Question>(
        object: T,
        result: MatchedAdverbial | MatchedQuestion,
        filters: ReadonlyArray<Filter>,
        key: keyof MatchedAdverbial | keyof MatchedQuestion,
        anyMatch: boolean,
        matchingFilters: Filter[])
        : [T, boolean] {
        const value = object[key];
        if (typeof value === 'string') {
            const [parts, partFilters] = this.searchField(value, key, filters);
            result[key] = parts;
            anyMatch ||= parts.match;
            matchingFilters.push(...partFilters);
        } else if (key == 'answers') {
            result[key] = [];
            const question = <Question>object;
            const answers = question.answers;

            const answerKeys: (keyof Answer)[] = [
                'answer',
                'dialect',
                'participantId'
            ];
            const answerFilters = filters.filter(
                filter => ['*', ...answerKeys].includes(filter.field));
            const matchingAnswerFilters = new Set<Filter>();
            for (const answer of answers) {
                const matchedAnswer = new MatchedAnswer(answer);
                for (const answerKey of answerKeys) {
                    const [parts, partFilters] = this.searchField(answer[answerKey], answerKey, answerFilters);
                    matchedAnswer.match ||= parts.match;
                    matchedAnswer[answerKey] = parts;
                    for (const filter of partFilters) {
                        matchingAnswerFilters.add(filter);
                    }
                }
                if (answerFilters.length) {
                    anyMatch ||= matchedAnswer.match;
                }
                result[key].push(matchedAnswer);
            }
            matchingFilters.push(...matchingAnswerFilters);
        } else if (Array.isArray(value)) {
            result[key] = [];
            for (const property of value) {
                const [parts, partFilters] = this.searchField(property, key, filters);
                anyMatch ||= parts.match;
                result[key].push(parts);
                matchingFilters.push(...partFilters);
            }
        }

        return [result[key], anyMatch];
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
                    if (!(filter.content[0] ?? '').trim()) {
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
            results.push(...needleGroup.split(' ')
                .filter(needle => needle)
                .map(needle => this.searchSingle(haystack, needle))
                .reduce((prev, matches, index) => {
                    if (matches.length === 0 || (index > 0 && prev.length === 0)) {
                        // every part (of the needle) should match
                        return [];
                    }

                    return prev.concat(matches);
                }, []));
        }

        return results;
    }

    /**
     * Returns the matches in the text (haystack) with their start and
     * end positions (exclusive). Case-insensitive and skips over special
     * characters.
     */
    private searchSingle(haystack: string, needle: string): [number, number][] {
        let haystackIndex = 0;
        let needleIndex = 0;
        let start = 0;
        const matches: [number, number][] = [];
        needle = needle.replace(ignoreCharactersExp, '').toLowerCase();

        while (haystackIndex < haystack.length) {
            const character = haystack[haystackIndex].toLowerCase();
            if (ignoreCharacters.indexOf(character) >= 0) {
                // ignore
                if (start === haystackIndex) {
                    start++; // don't highlight leading characters
                }
                haystackIndex++;
            } else if (character === needle[needleIndex] ||
                removeDiacritics(character) === needle[needleIndex]) {
                // match!
                needleIndex++;
                haystackIndex++;

                if (needleIndex === needle.length) {
                    matches.push([start, haystackIndex]);
                    start = haystackIndex;
                    needleIndex = 0;
                }
            } else {
                // no match! move one character ahead from the last
                // starting point
                haystackIndex = start + 1;
                start = haystackIndex;
                needleIndex = 0;
            }
        }

        return matches;
    }
}
