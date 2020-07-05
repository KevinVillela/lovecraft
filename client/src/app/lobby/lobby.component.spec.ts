import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LobbyComponent} from './lobby.component';
import {LobbyModule} from './lobby.module';
import {TestModule} from '../testing/test.module';
import {LobbyComponentHarness} from './testing/lobby.component.harness';
import {GameService} from '../game/game.service';
import {Component, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {GameState} from '../../../../game/models/models';
import {GameBuilder} from '../../../../game/testing/test_utils';

describe('LobbyComponent', () => {
  let component: LobbyComponent;
  let fixture: ComponentFixture<TestComponent>;
  let harness: LobbyComponentHarness;
  let gameService: GameService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [LobbyModule, TestModule],
      declarations: [TestComponent],
      providers: [{
        provide: ActivatedRoute,
        useValue: {snapshot: {paramMap: new Map<string, string>([['game_id', 'gameThread']])}}
      }]
    });

  }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(TestComponent);
    harness = await TestbedHarnessEnvironment.loader(fixture).getHarness(LobbyComponentHarness);
    component = fixture.componentInstance.lobbyComponent;
    fixture.detectChanges();
    gameService = TestBed.inject(GameService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display players', async () => {
    await gameService.forceGameState(new GameBuilder('gameThread')
        .setState(GameState.NOT_STARTED)
        .addPlayer('p1')
        .addPlayer('p2')
        .build());
    fixture.detectChanges();

    expect(await harness.getPlayers()).toEqual(['p1', 'p2']);
  });

  it('should allow joining and starting', async () => {
    await gameService.forceGameState(new GameBuilder('gameThread')
        .setState(GameState.NOT_STARTED)
        .addPlayer('p1')
        .addPlayer('p2')
        .build());
    fixture.detectChanges();

    expect(await harness.startButton()).toBeNull();
    const joinButton = await harness.joinButton();
    expect(joinButton).toBeDefined();
    await joinButton.click();

    expect(await harness.joinButton()).toBeNull();
    expect(await harness.getPlayers()).toEqual(['p1', 'p2', 'villela@google.com']);
    const startButton = await harness.startButton();
    expect(startButton).toBeDefined();
    await startButton.click();

    expect(component.game.value.state).toEqual(GameState.IN_PROGRESS);
  });
});


/**
 * This class exists because I couldn't figure out how to compile the LobbyComponent by itself.
 */
@Component({
  template: `
    <app-lobby></app-lobby>`
})
export class TestComponent {
  @ViewChild(LobbyComponent) lobbyComponent;
}
