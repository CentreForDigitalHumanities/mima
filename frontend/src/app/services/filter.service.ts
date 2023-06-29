import { Injectable } from '@angular/core';
import { Adverbial, MatchedAdverbial, MatchedParts } from '../models/adverbial';
import { Filter, FilterOperator } from '../models/filter';

const ignoreCharacters = ['-', '\'', '.', ',', '(', ')'];
const ignoreCharactersExp = /[\-'\.\,\(\)\s]/g;

// https://stackoverflow.com/a/37511463/8438971
function removeDiacritics(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

@Injectable({
    providedIn: 'root'
})
export class FilterService {

    constructor() { }

    /**
     * @returns MatchedAdverbial or undefined if it doesn't match
     */
    public applyFilters(adverbial: Adverbial, filters: ReadonlyArray<Filter>, operator: FilterOperator): MatchedAdverbial {
        let anyMatch = false;
        const result = new MatchedAdverbial();
        const matchingFilters: Filter[] = [];
        const keys: (keyof MatchedAdverbial)[] = [
            'id',
            'text',
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
        for (const key of keys) {
            result[key], anyMatch = this.detect_matches(adverbial, result, filters, key, anyMatch, matchingFilters);
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
            return result;
        }

        return undefined;
    }
    /**
     * Detect matches for a certain field of Adverbial,
     * either a string field or an array field
     * @param adverbial Adverbial object in which to detect matches
     * @param result MatchedAdverbial object in which to update the matches
     * @param filters filters to apply
     * @param key name of the field
     * @param anyMatch boolean, if any match is present
     * @param matchingFilters List of matching filters
     * @returns MatchedParts or MatchedParts[], anyMatch (boolean)
     */
    private detect_matches(adverbial: Adverbial, result: MatchedAdverbial, filters: ReadonlyArray<Filter>, key:string, anyMatch:boolean, matchingFilters: Filter[]) {
        if (typeof adverbial[key] === 'string') {
            const [parts, partFilters] = this.searchField(adverbial[key], key as keyof Adverbial, filters);
            result[key] = parts;
            anyMatch ||= parts.match;
            matchingFilters.push(...partFilters);
            return result[key], anyMatch;
        } else if (Array.isArray(adverbial[key])){
            result[key] = [];
            for (const text of adverbial[key]) {
                const [parts, partFilters] = this.searchField(text, key as keyof Adverbial, filters);
                matchingFilters.push(...partFilters);
                anyMatch ||= parts.match;
                result[key].push(parts);
            }
            return result[key], anyMatch;
        }
    }


    /**
     * Search a single field using filters
     * @param text field text to search
     * @param field name of the field
     * @param filters filters to apply
     * @returns [MatchedParts, Set<Filter>] matched parts and the matching filter
     */
    private searchField(text: string, field: keyof Adverbial, filters: ReadonlyArray<Filter>): [MatchedParts, Set<Filter>] {
        const matches: [number, number][] = [];
        const matchingFilters = new Set<Filter>();
        let emptyFilter = false;
        let anythingMatched = false;
        if (filters?.length) {
            for (const filter of filters) {
                if (filter.field === '*' || filter.field === field) {
                    const filterMatches = this.searchMultiple(text, filter.content);
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
    private searchMultiple(haystack: string, needles: string[]): [number, number][] {
        const results = [];
        for (const needleGroup of needles) {
            results.push(... needleGroup.split(' ')
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
