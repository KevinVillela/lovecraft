import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';

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

  it('should magnify cards', async () => {
    await gameService.forceGameState(makeGame(
        'gameThread', 1, {
          'villela@google.com': 'RRRRR',
          'p2@google.com': 'RRRRR',
        },
        ''));
    fixture.detectChanges();

    await harness.pickCardFromPlayer('p2@google.com', 0);

    expect(await harness.isCardMagnifified('villela@google.com', 0)).toBeFalse();
    await harness.pickCardFromPlayer('villela@google.com', 0);
    expect(await harness.isCardMagnifified('villela@google.com', 0)).toBeTrue();
    expect(await harness.isCardMagnifified('villela@google.com', 1)).toBeFalse();
    await harness.pickCardFromPlayer('villela@google.com', 0);
    expect(await harness.isCardMagnifified('villela@google.com', 0)).toBeFalse();

    const pickedCard = await harness.pickedCard(0);
    expect(await pickedCard.isMagnified()).toBeFalse();
    await pickedCard.click();
    expect(await pickedCard.isMagnified()).toBeTrue();
  });

  it('should highlight investigator', async () => {
    await gameService.forceGameState(makeGame(
        'gameThread', 1, {
          'villela@google.com': 'RRRRR',
          'p2@google.com': 'RRRRR',
        },
        ''));
    fixture.detectChanges();

    expect(await harness.getInvestigator()).toEqual('villela@google.com');
    expect(await harness.isHighlighted('villela@google.com')).toBe(true);
    expect(await harness.isHighlighted('p2@google.com')).toBe(false);

    await harness.pickCardFromPlayer('p2@google.com', 0);
    expect(await harness.getInvestigator()).toEqual('p2@google.com');
    expect(await harness.isHighlighted('villela@google.com')).toBe(false);
    expect(await harness.isHighlighted('p2@google.com')).toBe(true);
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

  it('should display game status', fakeAsync(async () => {
    await gameService.forceGameState(makeGame(
        'gameThread', 1, {
          'villela@google.com': 'RRRRR',
          'p2@google.com': 'RRRRS',
          'p3@google.com': 'RRRRR',
        },
        ''));
    tick(2000);
    fixture.detectChanges();

    expect(await harness.getRound()).toEqual('Round 1');
    expect(await harness.getCultists()).toEqual('Cultists: 1');
    expect(await harness.getRemaining()).toEqual('Remaining picks this round: 3');
    expect(await harness.elderSignedPicked()).toEqual('Elder Signs Picked: 0 / 3');

    await harness.pickCardFromPlayer('p2@google.com', 4);
    expect(await harness.getRemaining()).toEqual('Remaining picks this round: 2');
    expect(await harness.elderSignedPicked()).toEqual('Elder Signs Picked: 1 / 2');

    // WARNING: This test fails...
  }));

  it('should display game status in later round', fakeAsync(async () => {
    await gameService.forceGameState(makeGame(
        'gameThread', 2, {
          'villela@google.com': 'RRRR',
          'p2@google.com': 'RRRM',
          'p3@google.com': 'RRRI',
          'p4@google.com': 'RRRR',
        },
        ''));
    fixture.detectChanges();

    expect(await harness.getRound()).toEqual('Round 2');
    expect(await harness.getCultists()).toEqual('Cultists: 1 - 2');
    expect(await harness.getRemaining()).toEqual('Remaining picks this round: 4');
    expect(await harness.miragePicked()).toEqual('Mirage picked: No');

    await harness.pickCardFromPlayer('p2@google.com', 3);
    expect(await harness.getRemaining()).toEqual('Remaining picks this round: 3');
    expect(await harness.miragePicked()).toEqual('Mirage picked: Yes');

    // WARNING: This test fails...
  }));
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
