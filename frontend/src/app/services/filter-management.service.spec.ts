import { TestBed, } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { FilterManagementService } from './filter-management.service';
import { State } from '../questionnaire.state';

type MockState = {
    questionnaire: {
        filters: State['questionnaire']['filters']
    }
}

describe('FilterManagementService', () => {
    let service: FilterManagementService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideMockStore<MockState>({
                    initialState: {
                        questionnaire: {
                            filters: []
                        }
                    }
                })
            ]
        });
        service = TestBed.inject(FilterManagementService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should convert to query params', () => {
        const queryParams = service.toQueryParams(
            'and',
            [{
                field: '*',
                content: ['hallo wereld'],
                index: 0,
                onlyFullMatch: false
            }, {
                field: '*',
                content: ['nog iets'],
                index: 1,
                onlyFullMatch: true
            }, {
                field: '*',
                content: ['maar er is meer!'],
                index: 1,
                onlyFullMatch: false
            }]);
        expect(queryParams).toEqual({
            '*': ['hallo wereld'],
            '_*': ['nog iets'],
            '*0': ['maar er is meer!'],
            'OP': ['and']
        })
    });
});
