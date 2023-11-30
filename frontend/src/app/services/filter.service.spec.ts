import { TestBed } from '@angular/core/testing';

import { Adverbial, MatchedAdverbialProperties, MatchedPart, MatchedParts } from '../models/adverbial';
import { Filter, FilterOperator } from '../models/filter';
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
            const properties = <MatchedAdverbialProperties>({ ...output});

            expect(getMatchedAdverbial(expected, emptyFilters)).toEqual(properties);
        }

    });
});
