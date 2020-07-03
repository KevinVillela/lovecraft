import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {CardImage, PlayComponent} from './play.component';
import {PlayModule} from './play.module';
import {TestModule} from '../testing/test.module';
import {ActivatedRoute} from '@angular/router';
import {PlayComponentHarness} from './testing/play.component.harness';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {Component, ViewChild} from '@angular/core';
import {GameService} from '../game/game.service';
import {makeGame} from '../../../../game/testing/test_utils';

describe('PlayComponent', () => {
  let component: PlayComponent;
  let fixture: ComponentFixture<TestComponent>;
  let harness: PlayComponentHarness;
  let gameService: GameService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [PlayModule, TestModule],
      declarations: [TestComponent],
      providers: [{
        provide: ActivatedRoute,
        useValue: {snapshot: {paramMap: new Map<string, string>([['game_id', 'gameThread']])}}
      }]
    });
  }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(TestComponent);
    harness = await TestbedHarnessEnvironment.loader(fixture).getHarness(PlayComponentHarness);
    component = fixture.componentInstance.playComponent;
    fixture.detectChanges();
    gameService = TestBed.inject(GameService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display all cards correctly', async () => {
    await gameService.forceGameState(makeGame(
        'gameThread', 1, {
          'villela@google.com': 'CSMEP',
          'p2@google.com': 'RRRRR',
        },
        ''));
    fixture.detectChanges();

    const roleCards = await harness.getRoleCards();
    expect(roleCards).toEqual([{image: CardImage.CULTIST}, {image: CardImage.BACK}]);

    const playCards = await harness.getPlayCards();
    expect(playCards).toEqual([
      {image: CardImage.CTHULHU}, {image: CardImage.ELDER_SIGN}, {image: CardImage.MIRAGE}, {image: CardImage.EVIL_PRESENCE}, {image: CardImage.PARANOIA},
      {image: CardImage.BACK}, {image: CardImage.BACK}, {image: CardImage.BACK}, {image: CardImage.BACK}, {image: CardImage.BACK}]);
  });

  it('should handle paranoia correctly', async () => {
    await gameService.forceGameState(makeGame(
        'gameThread', 1, {
          'villela@google.com': 'RRRRR',
          'p2@google.com': 'RRRRP',
          'p3@google.com': 'RRRRR',
        },
        ''));
    fixture.detectChanges();

    await harness.pickCardFromPlayer('p2@google.com', 4);

    expect(await harness.getInvestigator()).toEqual('p2@google.com');
    await harness.pickCardFromPlayer('p3@google.com', 0);
    expect(await harness.getInvestigator()).toEqual('p2@google.com');
  });

  it('should handle private eye correctly', async () => {
    await gameService.forceGameState(makeGame(
        'gameThread', 1, {
          'villela@google.com': 'RRRRR',
          'p2@google.com': 'RRRRI',
          'p3@google.com': 'RRRRR',
        },
        ''));
    fixture.detectChanges();

    expect(await harness.roleForPlayer('villela@google.com')).toEqual(CardImage.CULTIST);

    expect(await harness.roleForPlayer('p2@google.com')).toEqual(CardImage.BACK);

    await harness.pickCardFromPlayer('p2@google.com', 4);
    expect(await harness.roleForPlayer('p2@google.com')).toEqual(CardImage.CULTIST);
  });
});

/**
 * This class exists because I couldn't figure out how to compile the PlayComponent by itself.
 */
@Component({
  template: `
    <app-play></app-play>`
})
export class TestComponent {
  @ViewChild(PlayComponent) playComponent;
}
