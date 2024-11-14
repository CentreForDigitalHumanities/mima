import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { JudgmentsService } from './judgments.service';

describe('JudgmentsService', () => {
  let service: JudgmentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
        imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(JudgmentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
