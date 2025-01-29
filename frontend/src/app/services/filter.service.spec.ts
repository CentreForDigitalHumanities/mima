import { TestBed } from '@angular/core/testing';

import { MatchedPart, MatchedParts } from '../models/matched-parts';
import { Filter, FilterOperator } from '../models/filter';
import { MatchedQuestion, MatchedQuestionProperties, Question } from '../models/question';
import { SearchExpression } from '../models/search-expression';
import { FilterService } from './filter.service';
import { Answer } from '../models/answer';

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
function getMatchedQuestion(adverbial: Question, emptyFilters: boolean): MatchedQuestionProperties {
    const result = {};
    for (const [key, value] of Object.entries(adverbial)) {
        if (Array.isArray(value)) {
            result[key] = value.map((item: string) => getMatchedParts(item, emptyFilters));
        } else {
            result[key] = getMatchedParts(value, emptyFilters);
        }
    }

    result['dialectsCount'] = 0;
    result['matchedAnswers'] = [];
    result['matchedAnswerCount'] = 0;
    result['matchedDialects'] = {};
    result['matchedDialectsCount'] = 0;
    result['matchedDialectNames'] = [];
    result['matchedParticipants'] = [];

    delete result['type'];
    delete result['question'];

    return result as MatchedQuestion;
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
            expected: Question,
            input: Question,
            filters: {
                field: Filter<'question'>['field'],
                content: string[],
                onlyFullMatch: boolean
            }[],
            operator: FilterOperator
        }[] = [{
            expected: {
                id: '',
                prompt: 'Dit is een *test*',
                type: '',
                answers: [],
                question: '',
                split_item: '',
                chapter: '',
                subtags: [],
                gloss: '',
                en_translation: ''

            },
            input: {
                id: '',
                prompt: 'Dit is een test',
                type: '',
                answers: [],
                question: '',
                split_item: '',
                chapter: '',
                subtags: [],
                gloss: '',
                en_translation: ''
            },
            filters: [{
                field: '*',
                content: ['test'],
                onlyFullMatch: false
            }],
            operator: 'and'
        }];

        for (const { expected, input, filters, operator } of testData) {
            const indexedFilters: Filter<'question'>[] = [];
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
            const properties = <MatchedQuestionProperties>{ ...output };

            const expectedQuestion = getMatchedQuestion(expected, emptyFilters);
            expect(properties).toEqual(expectedQuestion);
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
                'appel & banaan',
                'alleen appel is niet goed',
                '                         '
            ],
            [
                'appel & banaan',
                'alleen banaan is ook niet goed',
                '                              '
            ],
            [
                'appel&banaan',
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

    it('should match dialects', () => {
        // mock questions
        const tests: {
            filter: string[],
            // should this question match?
            match: boolean,
            matchedDialectNames: string[],
            answers: {
                dialects: string[],
                match: boolean
            }[]
        }[] = [
                // search for a filter and define mock answers which should or should not match
                {
                    filter: ['Zuid-Brabants'],
                    match: true,
                    // match itself
                    matchedDialectNames: ['Zuid-Brabants'],
                    answers: [{
                        dialects: ['Nederfrankisch', 'Brabants', 'Zuid-Brabants', 'Antwerps'],
                        match: true
                    }, {
                        dialects: ['Fries', 'West-Fries'],
                        match: false
                    }]
                },
                {
                    filter: ['Antwerps'],
                    match: true,
                    // also just match end nodes without children
                    matchedDialectNames: ['Antwerps'],
                    answers: [{
                        dialects: ['Nederfrankisch', 'Brabants', 'Zuid-Brabants', 'Antwerps'],
                        match: true
                    }]
                },
                {
                    filter: ['Brabants'],
                    match: false,
                    matchedDialectNames: [],
                    answers: [{
                        dialects: ['Nedersaksisch', 'Achterhoeks'],
                        match: false
                    }]
                }
            ];

        for (const test of tests) {
            const filter = {
                content: test.filter,
                field: 'dialects',
                index: 0,
                onlyFullMatch: true
            };

            const answers: Answer[] = <any>test.answers.map((item, n) => ({ answerId: `${n}-${item.match}`, ...item }));
            const question: Question = {
                id: 'id',
                type: 'type',
                question: 'question',
                prompt: '',
                split_item: '',
                chapter: '',
                subtags: [],
                gloss: '',
                en_translation: '',
                answers
            };

            const actual = <MatchedQuestion>service.applyFilters(question, [<any>filter], 'and');
            expect(!!actual).toEqual(test.match, `Question should not match: ${test.filter}`);
            if (!test.match) {
                // don't test the underlying answers; the object
                // should not exist so there is nothing to check
                continue;
            }

            expect(new Set(actual.matchedDialectNames)).toEqual(new Set(test.matchedDialectNames));
            for (const matchedAnswer of actual.answers) {
                const pass = matchedAnswer.match === (matchedAnswer.answerId.text.split('-')[1] === 'true');
                if (!pass) {
                    fail(`Searching for ${test.filter} in ${matchedAnswer.answerId.text}.`);
                }
            }
        }
    })
});
