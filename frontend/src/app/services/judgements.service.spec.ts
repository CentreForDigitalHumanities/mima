import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { JudgementsService } from './judgements.service';

describe('JudgementsService', () => {
  let service: JudgementsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
        imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(JudgementsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
