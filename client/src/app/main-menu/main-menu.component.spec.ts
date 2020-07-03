import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {MainMenuComponent} from './main-menu.component';
import {MainMenuModule} from './main-menu.module';
import {TestModule} from '../testing/test.module';
import {MainMenuComponentHarness} from './testing/main-menu.component.harness';
import {GameService} from '../game/game.service';
import {Component, ViewChild} from '@angular/core';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {makeGame} from '../../../../game/testing/test_utils';
import {Game, GameState} from '../../../../game/models/models';
import {ready, StatusAnd} from '../common/status_and';
import {Subject} from 'rxjs';

describe('MainMenuComponent', () => {
  let component: MainMenuComponent;
  let fixture: ComponentFixture<TestComponent>;
  let harness: MainMenuComponentHarness;
  let gameService: jasmine.SpyObj<GameService>;
  const listGamesSubject = new Subject<StatusAnd<Record<string, Game>>>();

  beforeEach(async(() => {
    gameService = jasmine.createSpyObj(['listGamesStream']);
    gameService.listGamesStream.and.returnValue(listGamesSubject);
    TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [MainMenuModule, TestModule],
      providers: [{provide: GameService, useValue: gameService}]
    });
  }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(TestComponent);
    harness = await TestbedHarnessEnvironment.loader(fixture).getHarness(MainMenuComponentHarness);
    component = fixture.componentInstance.mainMenuComponent;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display all games correctly', async () => {
    const game1 = makeGame(
        'game1', 1, {p0: 'CSRRR', p1: 'RRRRR', p2: 'SSSRR', p3: 'RRRRR'},
        '');
    game1.created = new Date(1, 2, 3);
    const game2 = makeGame(
        'game2', 1, {p0: 'CSRRR', p1: 'RRRRR', p2: 'SSSRR', p3: 'RRRRR'},
        '');
    game2.state = GameState.CULTISTS_WON;
    listGamesSubject.next(ready({game1, game2}));

    fixture.detectChanges();

    expect(await harness.getGames()).toEqual([{
      title: 'game1  - 4 here now',
      subTitle: 'Created Mar 3, 1901, 12:00:00 AM'
    }]);
  });
});

/**
 * This class exists because I couldn't figure out how to compile the MainMenuComponent by itself.
 */
@Component({
  template: `
    <app-main-menu></app-main-menu>`
})
export class TestComponent {
  @ViewChild(MainMenuComponent) mainMenuComponent;
}
