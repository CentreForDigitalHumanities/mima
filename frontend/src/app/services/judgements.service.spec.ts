import { TestBed } from '@angular/core/testing';

import { JudgementsService } from './judgements.service';

describe('JudgementsService', () => {
  let service: JudgementsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JudgementsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
