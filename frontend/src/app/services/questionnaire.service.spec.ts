import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { QuestionnaireService } from './questionnaire.service';
import { Dialect, DialectLookup } from '../models/dialect';

describe('QuestionnaireService', () => {
    let service: QuestionnaireService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule]
        });
        service = TestBed.inject(QuestionnaireService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fill the dialect lookup as expected', () => {
        // manually construct a simplified tree of dialects
        const dialects: Dialect[] = ['Fries', 'West-Fries', 'Nederfrankisch', 'Brabants', 'Urks', 'Nedersaksisch', 'Achterhoeks', 'Zutphens'].map(name => ({
            name,
            children: [],
            parents: []
        }));

        const hierarchy: { [dialect: string]: Dialect } = {};

        for (const dialect of dialects) {
            hierarchy[dialect.name] = dialect;
        }

        hierarchy['West-Fries'].parents = [hierarchy['Fries']];
        hierarchy['Fries'].children = [hierarchy['West-Fries']];

        hierarchy['Nederfrankisch'].children = [
            hierarchy['Brabants'],
            hierarchy['Urks']
        ];

        hierarchy['Brabants'].parents = [hierarchy['Nederfrankisch']];
        hierarchy['Urks'].parents = [
            hierarchy['Nederfrankisch'],
            hierarchy['Nedersaksisch']];

        hierarchy['Nedersaksisch'].children = [
            hierarchy['Achterhoeks'],
            hierarchy['Urks']
        ];

        hierarchy['Achterhoeks'].parents = [hierarchy['Nedersaksisch']];
        // already assigned the parent for Urks

        hierarchy['Achterhoeks'].children = [hierarchy['Zutphens']];
        hierarchy['Zutphens'].parents = [hierarchy['Achterhoeks']];

        const expectedRoot =
            [
                hierarchy['Fries'],
                hierarchy['Nederfrankisch'],
                hierarchy['Nedersaksisch']
            ];

        const expected = new DialectLookup(expectedRoot, hierarchy);

        const actualHierarchy: DialectLookup['hierarchy'] = {};
        const actualRoot = service.fillDialectLookup(
            {
                "Fries": {
                    "West-Fries": {}
                },
                "Nederfrankisch": {
                    "Brabants": {},
                    "Urks": {}
                },
                "Nedersaksisch": {
                    "Achterhoeks": {
                        "Zutphens": {}
                    },
                    "Urks": {}
                },
            },
            actualHierarchy);

        const actual: DialectLookup = new DialectLookup(actualRoot, actualHierarchy);

        expect(actual).toEqual(expected);
    });
});
