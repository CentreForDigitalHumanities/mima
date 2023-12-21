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
            }]);
        console.log(queryParams);
        expect(queryParams).toEqual({
            '*0': ['hallo wereld'],
            '_*1': ['nog iets'],
            'OP': ['and']
        })
    });
});
