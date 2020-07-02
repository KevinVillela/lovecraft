import {TestBed} from '@angular/core/testing';

import {ErrorService} from './error.service';
import {CommonServicesModule} from './common.module';

describe('ErrorServiceService', () => {
  let service: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [CommonServicesModule]});
    service = TestBed.inject(ErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
