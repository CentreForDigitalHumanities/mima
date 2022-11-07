import { Injectable } from '@angular/core';
import { Adverbial, MatchedAdverbial, MatchedParts } from '../models/adverbial';
import { Filter } from '../models/filter';

const ignoreCharacters = ['-', '\'', '.', '(', ')'];
const ignoreCharactersExp = /[\-'\.\(\)\s]/g;


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
    public applyFilters(adverbial: Adverbial, filters: Filter[]): MatchedAdverbial {
        let anyMatch = false;
        const result = new MatchedAdverbial();
        const keys: (keyof Omit<MatchedAdverbial, 'labels'>)[] = [
            'id',
            'text',
            'example',
            'translation',
            'gloss',
            'language',
            'dialect',
            'language_family',
            'language_group',
            'source',
            'notes'];
        for (const key of keys) {
            const parts = this.searchField(adverbial[key], key, filters);
            anyMatch ||= parts.match;
            result[key] = parts;
        }
        result.labels = [];
        for (const label of adverbial.labels) {
            const parts = this.searchField(label, 'labels', filters);
            anyMatch ||= parts.match;
            result.labels.push(parts);
        }

        if (anyMatch) {
            return result;
        }

        return undefined;
    }

    /**
     * Search a single field using filters
     * @param text field text to search
     * @param field name of the field
     * @param filters filters to apply
     * @returns MatchedParts
     */
    private searchField(text: string, field: keyof Adverbial, filters: Filter[]): MatchedParts {
        const matches: [number, number][] = [];
        let emptyFilter = false;
        if (filters?.length) {
            for (const filter of filters) {
                if (filter.field === '*' || filter.field === field) {
                    matches.push(... this.searchMultiple(text, filter.text));
                    if (!(filter.text ?? '').trim()) {
                        // an empty filter matches everything!
                        emptyFilter = true;
                    }
                }
            }
        } else {
            emptyFilter = true;
        }

        const results: MatchedParts = {
            empty: !(text ?? '').trim(),
            parts: [],
            fullMatch: !emptyFilter && matches.length > 0,
            match: emptyFilter || matches.length > 0,
            emptyFilters: emptyFilter
        };

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

        let lastIndex = 0;
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
                    const lastMatchEndIndex = mergedMatches[mergedIndex][1];
                    if (lastMatchEndIndex >= start) {
                        // merge!
                        mergedMatches[mergedIndex][1] = end;
                    } else {
                        mergedMatches.push([start, end]);
                    }
                }
            }

            // returns the marked string
            for (const [start, end] of mergedMatches) {
                if (start > lastIndex) {
                    pushMiss(text.substring(lastIndex, start));
                }

                pushMatch(text.substring(start, end));

                lastIndex = end;
            }
        }

        if (lastIndex < text.length) {
            pushMiss(text.substring(lastIndex));
        }

        return results;
    }

    /**
     * Splits search text by space and match each separate item
     */
    private searchMultiple(haystack: string, needles: string): [number, number][] {
        return needles.split(' ')
            .filter(needle => needle)
            .map(needle => this.searchSingle(haystack, needle))
            .reduce((prev, matches, index) => {
                if (matches.length === 0 || (index > 0 && prev.length === 0)) {
                    // every part should match
                    return [];
                }

                return prev.concat(matches);
            }, []);
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
        needle = needle.replace(ignoreCharactersExp, '');

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
