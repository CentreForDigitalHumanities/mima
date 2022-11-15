import { TestBed } from '@angular/core/testing';

import { AdverbialsService } from './adverbials.service';

describe('AdverbialsService', () => {
    let service: AdverbialsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AdverbialsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
