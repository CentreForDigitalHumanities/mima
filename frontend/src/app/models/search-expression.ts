const ignoreCharacters = ['-', '\'', '.', ',', '(', ')'];
export const ignoreCharactersExp = /[\-'\.\,\(\)\s]/g;

// https://stackoverflow.com/a/37511463/8438971
function removeDiacritics(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Returns the matches in the text (haystack) with their start and
 * end positions (exclusive). Case-insensitive and skips over special
 * characters.
 */
function searchSingle(haystack: string, needle: string): [number, number][] {
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

/**
 * Search a string using a query expression. The expression can be:
 *
 *  * words, any matching word will return
 *  * combination using ANDs, all words combined should match or an
 *    empty match will be returned
 *  * an exact phrase surrounded by ""
 *  * any combination of these
 */
export class SearchExpression {
    /**
     * Current group (for AND queries).
     */
    private current: [number, number][];

    /**
     * Whether an AND statement is being matched.
     */
    private and: boolean;

    /**
     * Reject everything from the current AND statement.
     */
    private rejectAnd: boolean;

    /**
     * Phrases being formed or NULL.
     */
    private phrases: [number, number][][] | null;

    /**
     * The first matches of a phrase should always be accepted
     * after that any match should be a continuation of the previous
     * match.
     */
    private startOfPhrase: boolean;

    /**
     * Parts of the query expression.
     */
    private queryParts: string[];

    public constructor(query: string) {
        this.queryParts = query.split(' ');
    }

    private init() {
        this.current = [];
        this.and = false;
        this.rejectAnd = false;
        this.phrases = null;
        this.startOfPhrase = false;
    }

    private closePhrases() {
        if (this.phrases.length === 0) {
            this.rejectAnd = true;
        }

        for (const phrase of this.phrases) {
            this.current.push(...phrase);
        }

        this.and = false;
        this.phrases = null;
    }

    private continuePhrases(matches: [number, number][]) {
        if (matches.length === 0) {
            // no match, abort all phrases!
            this.phrases = [];
            return;
        }
        const updatedPhrases: [number, number][][] = [];
        for (const phrase of this.phrases) {
            const [_, end] = phrase[phrase.length - 1];

            for (const match of matches) {
                // this match should be a continuation of a phrase
                if (match[0] - 3 < end) {
                    updatedPhrases.push(phrase.concat([match]));
                }
            }
        }

        this.phrases = updatedPhrases;
    }

    private handlePhraseMarker() {
        if (this.phrases === null) {
            // opening new phrase groups
            this.phrases = [];
            this.startOfPhrase = true;
        } else {
            this.closePhrases();
        }
    }

    /**
     * Push the current group to the results
     * @param result
     */
    private pushCurrent(result: [number, number][]) {
        if (!this.rejectAnd) {
            result.push(...this.current);
        }

        this.current = [];
        this.rejectAnd = false;
    }

    /**
     * Search for a word in the haystack and append to the current group or phrase
     * @param wordPart word to match
     * @param haystack haystack to search through
     */
    private matchWord(wordPart: string, haystack: string) {
        const partMatches = searchSingle(haystack, wordPart);
        if (this.phrases !== null) {
            if (this.startOfPhrase) {
                if (partMatches.length) {
                    this.phrases.push(partMatches);
                }
            } else {
                this.continuePhrases(partMatches);
            }
        } else {
            if (this.and && partMatches.length === 0) {
                this.rejectAnd = true;
            } else {
                this.current.push(...partMatches);
            }
            this.and = false;
        }

        this.startOfPhrase = false;
    }

    public search(haystack: string): [number, number][] {
        this.init();

        const result: [number, number][] = [];

        for (let part of this.queryParts) {
            if (part.toUpperCase() === "AND") {
                this.and = true;
                if (this.current.length === 0) {
                    this.rejectAnd = true;
                }
                continue;
            }

            if (!this.and) {
                this.pushCurrent(result);
            }

            if (part.startsWith('"')) {
                this.handlePhraseMarker();
            }

            // we are searching for words, not quotation marks
            const wordPart = part.replace(/"/g, '');

            if (wordPart.length) {
                this.matchWord(wordPart, haystack);
            }

            // the quotation mark can also be affixed at the end of a part, e.g.:
            // this is" a valid query"
            if (part.substring(1).endsWith('"')) {
                this.handlePhraseMarker();
            }
        }

        if (this.phrases?.length) {
            this.closePhrases();
        }

        if (!this.rejectAnd) {
            result.push(...this.current);
        }

        return result;
    }
}
