import { TestBed } from '@angular/core/testing';

import { Adverbial, MatchedAdverbialProperties, MatchedPart, MatchedParts } from '../models/adverbial';
import { Filter, FilterOperator } from '../models/filter';
import { SearchExpression } from '../models/search-expression';
import { FilterService } from './filter.service';

function getMatchedParts(text: string, emptyFilters: boolean): MatchedParts {
    // no match
    if (text.indexOf('*') === -1) {
        return new MatchedParts({
            empty: text.length === 0,
            fullMatch: false,
            match: false,
            parts: text
                ? [{ match: false, text }]
                : [],
            emptyFilters
        });
    }

    // full match without content
    if (text === '**') {
        return new MatchedParts({
            empty: true,
            fullMatch: true,
            match: true,
            parts: [],
            emptyFilters
        });
    }

    // full match with content
    if (/^\*[^\*]+\*$/.test(text)) {
        return new MatchedParts({
            empty: false,
            fullMatch: true,
            match: true,
            parts: [{
                match: true,
                text: text.substring(1, text.length - 1)
            }],
            emptyFilters
        });
    }

    // partial match
    let index = 0;
    let match = false;
    const parts: MatchedPart[] = [];
    while (index < text.length) {
        let matchIndex = text.indexOf('*', index);
        if (matchIndex == -1) {
            // include up to the end
            matchIndex = text.length;
        }
        if (matchIndex - index > 1) {
            parts.push({
                match,
                text: text.substring(index, matchIndex)
            });
        }

        match = !match;
        // skip the asterisk
        index = matchIndex + 1;
    }

    return new MatchedParts({
        empty: false,
        fullMatch: false,
        match: true,
        parts,
        emptyFilters
    });
}

/**
 * Constructs a mock matched adverbial.
 * @param adverbial adverbial containing *highlighted* texts
 */
function getMatchedAdverbial(adverbial: Adverbial, emptyFilters: boolean): MatchedAdverbialProperties {
    const result = {};
    for (const [key, value] of Object.entries(adverbial)) {
        if (Array.isArray(value)) {
            result[key] = value.map((item: string) => getMatchedParts(item, emptyFilters));
        } else {
            result[key] = getMatchedParts(value, emptyFilters);
        }
    }

    return result as MatchedAdverbialProperties;
}

describe('FilterService', () => {
    let service: FilterService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(FilterService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // Fix this test when we define the adverbials better
    it('should match', () => {
        const testData: {
            expected: Adverbial,
            input: Adverbial,
            filters: {
                field: Filter['field'],
                content: string[],
                onlyFullMatch: boolean
            }[],
            operator: FilterOperator
        }[] = [{
            expected: {
                id: '',
                text: 'Dit is een *test*',
                roots: [''],
                examples: [''],
                translations: [''],
                glosses: [''],
                language: '',
                dialect: '',
                language_family: '',
                language_group: '',
                source: '',
                labels: [],
                notes: '',

            },
            input: {
                id: '',
                text: 'Dit is een test',
                roots: [''],
                examples: [''],
                translations: [''],
                glosses: [''],
                language: '',
                dialect: '',
                language_family: '',
                language_group: '',
                source: '',
                labels: [],
                notes: '',
            },
            filters: [{
                field: '*',
                content: ['test'],
                onlyFullMatch: false
            }],
            operator: 'and'
        }];

        for (const { expected, input, filters, operator } of testData) {
            const indexedFilters: Filter[] = [];
            let index = 0;
            let emptyFilters = true;
            for (let filter of filters) {
                indexedFilters.push({
                    index,
                    ...filter
                });
                if (filter.content.find(x => x.length)) {
                    emptyFilters = false;
                }
                index++;
            }

            const output = service.applyFilters(input, indexedFilters, operator);
            const properties = <MatchedAdverbialProperties>({ ...output });

            expect(getMatchedAdverbial(expected, emptyFilters)).toEqual(properties);
        }

    });

    it('should support search queries', () => {
        // contains query, haystack and the expected matches marked with asterisks
        const tests: [string, string, string][] = [
            [
                'appel',
                'ik zoek een appel',
                '            *****'
            ],
            [
                'appel of banaan',
                'alleen appel is goed',
                '       *****        '
            ],
            [
                'appel AND banaan',
                'alleen appel is niet goed',
                '                         '
            ],
            [
                'appel AND banaan',
                'alleen banaan is ook niet goed',
                '                              '
            ],
            [
                'appel AND banaan',
                'een appel en banaan is wel goed',
                '    *****    ******            '
            ],
            [
                'banaan en "een appel"',
                'uno banaan of een appel',
                '    ******    *** *****'
            ],
            [
                'mango of " een appel "',
                'de banaan en de appel',
                '                     '
            ],
            [
                '"niet',
                'de query is nog niet af',
                '                ****   '
            ],
            [
                '"een"',
                'ook een woord moet kunnen',
                '    ***                  '
            ]
        ];

        for (const [query, haystack, expected] of tests) {
            const searchExpression = new SearchExpression(query);
            let actual = searchExpression.search(haystack);
            actual = service.mergeMatches(actual);
            let match: RegExpMatchArray;
            let matchIndex = 0;
            const matchPattern = /\*+/g;
            let description = `query:    ${query}
haystack: ${haystack}
expected: ${expected}
actual:   ${actual}`;

            const expectedIndexes: [number, number][] = [];
            while (match = matchPattern.exec(expected)) {
                description = `query:    ${query}
haystack: ${haystack}
expected: ${expected}
            ${expectedIndexes}
actual:   ${actual}`;
                try {
                    const [start, end] = actual[matchIndex]
                    expect([match.index, match.index + match[0].length]).withContext(description).toEqual([start, end]);
                    matchIndex++;
                    expectedIndexes.push([match.index, match.index + match[0].length]);
                }
                catch (error) {
                    console.log(description);
                    throw error;
                }
            }

            expect(matchIndex).withContext(description).toEqual(actual.length);
        }
    });
});
