import { TestBed } from '@angular/core/testing';

import { FilterWorkerService } from './filter-worker.service';

describe('FilterWorkerService', () => {
  let service: FilterWorkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterWorkerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
