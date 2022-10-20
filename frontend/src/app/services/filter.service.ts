import { Injectable } from '@angular/core';
import { Adverbial } from '../models/adverbial';
import { Filter } from '../models/filter';

const ignoreCharacters = ['-', '\'', '.', '(', ')'];
const ignoreCharactersExp = /[\-'\.\(\)]/g;

@Injectable({
    providedIn: 'root'
})
export class FilterService {

    constructor() { }

    public filterMatch(adverbial: Adverbial, filter: Filter): boolean {
        if (!filter.text) {
            // empty text? always match
            return true;
        }

        for (const field of Object.keys(adverbial) as (keyof Adverbial)[]) {
            if (filter.field !== '*' && filter.field !== field) {
                continue;
            }
            switch (field) {
                case 'labels':
                    // contains multiple values to match
                    for (const label of adverbial[field]) {
                        if (this.matchTexts(label, filter.text).length) {
                            return true;
                        }
                    }
                    break;
                default:
                    if (this.matchTexts(adverbial[field], filter.text).length) {
                        return true;
                    }
                    break;
            }
        }

        return false;
    }

    public *highlightFilterMatches(text: string, field: keyof Adverbial, filters: Filter[] = []):
        Iterable<{ part: string, match: boolean }> {
        const matches: [number, number][] = [];
        if (filters?.length) {
            for (const filter of filters) {
                if (filter.field === '*' || filter.field === field) {
                    matches.push(... this.matchTexts(text, filter.text));
                }
            }
        }

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
                    yield {
                        part: text.substring(lastIndex, start),
                        match: false
                    };
                }

                yield {
                    part: text.substring(start, end),
                    match: true
                };

                lastIndex = end;
            }
        }

        if (lastIndex < text.length) {
            yield {
                part: text.substring(lastIndex),
                match: false
            };
        }
    }

    /**
     * Splits search text by space and match each separate item
     */
    private matchTexts(haystack: string, needles: string): [number, number][] {
        return needles.split(' ')
            .filter(needle => needle)
            .map(needle => this.matchText(haystack, needle))
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
    private matchText(haystack: string, needle: string): [number, number][] {
        let haystackIndex = 0;
        let needleIndex = 0;
        let start = 0;
        const matches: [number, number][] = [];
        needle = needle.replace(ignoreCharactersExp, '');

        while (haystackIndex < haystack.length) {
            const character = haystack[haystackIndex].toLowerCase();
            if (ignoreCharacters.indexOf(character) >= 0) {
                // ignore
                haystackIndex++;
            } else if (character === needle[needleIndex]) {
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
