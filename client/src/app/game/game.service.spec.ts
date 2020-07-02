import {TestBed} from '@angular/core/testing';

import {GameService} from './game.service';
import {TestModule} from '../testing/test.module';

describe('GameServiceService', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [TestModule]});
    service = TestBed.inject(GameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
