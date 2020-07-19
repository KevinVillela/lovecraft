import {fakeAsync, TestBed, tick} from '@angular/core/testing';

import {NoiseService, SOUNDS} from './noise.service';
import {PlayModule} from '../../play/play.module';
import {FakeNoiseService, TestModule} from '../../testing/test.module';
import {GameService} from '../../game/game.service';
import {GameBuilder} from '../../../../../game/testing/test_utils';
import {GameState} from '../../../../../game/models/models';

describe('NoiseService', () => {
  let service: FakeNoiseService;
  let gameService: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [PlayModule, TestModule]});
    service = TestBed.inject(NoiseService) as FakeNoiseService;
    gameService = TestBed.inject(GameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should do nothing when disabled', fakeAsync(async () => {
    service.enable('gameThread');
    service.disable();
    await gameService.forceGameState(new GameBuilder('gameThread')
        .setState(GameState.IN_PROGRESS)
        .addPlayer('villela@google.com')
        .addPlayer('p1')
        .setVisibleCards('R')
        .setInvestigator('villela@google.com')
        .build());

    tick(10000);
    expect(service.madeNoise).toEqual([]);
  }));

  it('should make noise for your turn', fakeAsync(async () => {
    service.enable('gameThread');
    await gameService.forceGameState(new GameBuilder('gameThread')
        .setState(GameState.IN_PROGRESS)
        .addPlayer('villela@google.com')
        .addPlayer('p1')
        .setVisibleCards('R')
        .setInvestigator('villela@google.com')
        .build());

    expect(service.madeNoise).toEqual([SOUNDS.HEARTBEAT]);
    tick(2000);
    expect(service.madeNoise).toEqual([SOUNDS.HEARTBEAT, SOUNDS.ROCK]);
    tick(1000);
    expect(service.madeNoise).toEqual([SOUNDS.HEARTBEAT, SOUNDS.ROCK, SOUNDS.YOUR_TURN]);
  }));

  it('should make noise for cultists win', fakeAsync(async () => {
    service.enable('gameThread');
    await gameService.forceGameState(new GameBuilder('gameThread')
        .setState(GameState.CULTISTS_WON)
        .addPlayer('villela@google.com')
        .addPlayer('p1')
        .setInvestigator('villela@google.com')
        .setVisibleCards('C')
        .build());

    expect(service.madeNoise).toEqual([SOUNDS.HEARTBEAT]);
    tick(3000);
    expect(service.madeNoise).toEqual([SOUNDS.HEARTBEAT, SOUNDS.CULTISTS_WIN]);
  }));
});
