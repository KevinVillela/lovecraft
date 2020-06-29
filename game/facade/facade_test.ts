import {makeGame} from '../testing/test_utils';
import {Card, GameState} from '../models/models';

import {GameFacade} from './facade';
import {InMemoryGameStore} from './in_memory_game_store';
import {BehaviorSubject} from 'rxjs';

describe('CreateGame', () => {
  it('creates games in not started state', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.createGame('id1', 'player1').subscribe();
    facade.createGame('id2', 'player2').subscribe();
    const listGames = new BehaviorSubject(null);
    facade.listGames().subscribe(listGames);
    expect(Object.keys(listGames.value)).toEqual(['id1', 'id2']);
    const game1 = new BehaviorSubject(null);
    facade.getGame('id1').subscribe(game1);
    expect(game1.value.state).toEqual(GameState.NOT_STARTED);

    const game2 = new BehaviorSubject(null);
    facade.getGame('id1').subscribe(game2);
    expect(game2.value.state).toEqual(GameState.NOT_STARTED);
    expect(game2.value.state).toEqual(GameState.NOT_STARTED);
  });

  it('throws on create if the ID exists.', () => {
    const facade = new GameFacade(new InMemoryGameStore());

    const game1 = new BehaviorSubject(null);
    facade.createGame('id1', 'player1').subscribe(game1);

    const game2 = new BehaviorSubject(null);
    facade.createGame('id1', 'player2').subscribe(game2);
    expect(game2.hasError).toBe(true);
  });
});

describe('StartGame', () => {
  it('sets a game to in progress', () => {
    const facade = new GameFacade(new InMemoryGameStore());

    facade.createGame('game1', 'player1').subscribe();
    facade.joinGame('game1', 'player2').subscribe();
    facade.joinGame('game1', 'player3').subscribe();
    facade.joinGame('game1', 'player4').subscribe();
    facade.startGame('game1').subscribe();

    const game1 = new BehaviorSubject(null);
    facade.getGame('game1').subscribe(game1);
    expect(game1.value.state).toEqual(GameState.IN_PROGRESS);
  });
});

describe('StartGame', () => {
  it('sets a game to in progress', () => {
    const facade = new GameFacade(new InMemoryGameStore());

    facade.createGame('game1', 'player1').subscribe();
    facade.joinGame('game1', 'player2').subscribe();
    facade.joinGame('game1', 'player3').subscribe();
    facade.joinGame('game1', 'player4').subscribe();
    facade.startGame('game1').subscribe();

    const game1 = new BehaviorSubject(null);
    facade.getGame('game1').subscribe(game1);
    expect(game1.value.state).toEqual(GameState.IN_PROGRESS);
  });
});

describe('Investigate', () => {
  it('sets the state correctly on an initial FUTILE_INVESTIGATION pick', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.forceGameState(makeGame(
        '', 1, {'p0': 'CSRRR', 'p1': 'RRRRR', 'p2': 'SSSRR', 'p3': 'RRRRR'},
        ''));
    facade.setInvestigator('', 'p0').subscribe();
    facade.investigate('', 'p0', 'p1', 1).subscribe();

    const gameSubject = new BehaviorSubject(null);
    facade.getGame('').subscribe(gameSubject);
    const game = gameSubject.value;

    // We expect to see the FUTILE_INVESTIGATION in our visible cards.
    expect(game.visibleCards).toEqual([Card.FUTILE_INVESTIGATION]);

    // We expect that p1's hand is missing a FUTILE_INVESTIGATION.
    expect(game.playerList[1].hand).toEqual([
      Card.FUTILE_INVESTIGATION, Card.FUTILE_INVESTIGATION,
      Card.FUTILE_INVESTIGATION, Card.FUTILE_INVESTIGATION
    ]);

    // We also expect p1 to be the current investigator.
    expect(game.currentInvestigatorId).toEqual('p1');

    // The game is in-progress still.
    expect(game.state).toBe(GameState.IN_PROGRESS);
  });

  it('sets the state correctly on an initial elder sign pick', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.forceGameState(makeGame(
        '', 1, {'p0': 'CRRRR', 'p1': 'RRRRR', 'p2': 'SSSSR', 'p3': 'RRRRR'},
        ''));
    facade.setInvestigator('', 'p0').subscribe();
    facade.investigate('', 'p0', 'p2', 1).subscribe();

    const gameSubject = new BehaviorSubject(null);
    facade.getGame('').subscribe(gameSubject);
    const game = gameSubject.value;

    // The card is in the visible cards now.
    expect(game.visibleCards).toEqual([Card.ELDER_SIGN]);

    // The player's hand is missing a light.
    expect(game.playerList[2].hand).toEqual([
      Card.ELDER_SIGN, Card.ELDER_SIGN, Card.ELDER_SIGN,
      Card.FUTILE_INVESTIGATION
    ]);

    // The player is now the current investigator.
    expect(game.currentInvestigatorId).toEqual('p2');

    // The game is in-progress still.
    expect(game.state).toBe(GameState.IN_PROGRESS);
  });

  it('sets the state correctly on an initial Cthulhu pick', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.forceGameState(makeGame(
        '', 1, {'p0': 'CRRRR', 'p1': 'RRRRR', 'p2': 'SSSSR', 'p3': 'RRRRR'},
        ''));
    facade.setInvestigator('', 'p1').subscribe();
    facade.investigate('', 'p1', 'p0', 1).subscribe();

    const gameSubject = new BehaviorSubject(null);
    facade.getGame('').subscribe(gameSubject);
    const game = gameSubject.value;

    // The card is in the visible cards now.
    expect(game.visibleCards).toEqual([Card.CTHULHU]);

    // The player's hand is missing a Cthulhu.
    expect(game.playerList[0].hand).toEqual([
      Card.FUTILE_INVESTIGATION, Card.FUTILE_INVESTIGATION,
      Card.FUTILE_INVESTIGATION, Card.FUTILE_INVESTIGATION
    ]);

    // The player is now the current investigator.
    expect(game.currentInvestigatorId).toEqual('p0');

    // The game is in-progress still.
    expect(game.state).toBe(GameState.CULTISTS_WON);
  });

  it('sets the state correctly on a final elder sign pick', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.forceGameState(makeGame(
        '', 1, {'p0': 'CRRRR', 'p1': 'RRRRR', 'p2': 'RS', 'p3': 'RRRRR'},
        'SSS'));
    facade.setInvestigator('', 'p0').subscribe();
    facade.investigate('', 'p0', 'p2', 2).subscribe();

    const gameSubject = new BehaviorSubject(null);
    facade.getGame('').subscribe(gameSubject);
    const game = gameSubject.value;

    // The card is in the visible cards now.
    expect(game.visibleCards).toEqual([
      Card.ELDER_SIGN, Card.ELDER_SIGN, Card.ELDER_SIGN, Card.ELDER_SIGN
    ]);

    // The player's hand is missing a light.
    expect(game.playerList[2].hand).toEqual([Card.FUTILE_INVESTIGATION]);

    // The player is now the current investigator.
    expect(game.currentInvestigatorId).toEqual('p2');

    // The game is in-progress still.
    expect(game.state).toBe(GameState.INVESTIGATORS_WON);
  });

  it('moves to the next round when we pick the last card for a round', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.forceGameState(makeGame(
        '', 1, {'p0': 'RRRRC', 'p1': 'RRRRR', 'p2': 'SSSSR', 'p3': 'RRRRR'},
        ''));
    facade.setInvestigator('', 'p0').subscribe();
    facade.investigate('', 'p0', 'p1', 1).subscribe();
    facade.investigate('', 'p1', 'p2', 1).subscribe();
    facade.investigate('', 'p2', 'p3', 1).subscribe();
    facade.investigate('', 'p3', 'p0', 1).subscribe();

    const gameSubject = new BehaviorSubject(null);
    facade.getGame('').subscribe(gameSubject);
    const game = gameSubject.value;

    // The card is in the visible cards now.
    expect(game.visibleCards).toEqual([
      Card.FUTILE_INVESTIGATION, Card.ELDER_SIGN, Card.FUTILE_INVESTIGATION,
      Card.FUTILE_INVESTIGATION
    ]);

    // Everyone's down a card.
    expect(game.playerList[0].hand.length).toEqual(4);
    expect(game.playerList[1].hand.length).toEqual(4);
    expect(game.playerList[2].hand.length).toEqual(4);
    expect(game.playerList[3].hand.length).toEqual(4);

    // The player is now the current investigator.
    expect(game.currentInvestigatorId).toEqual('p0');

    // The game is in-progress still.
    expect(game.state).toEqual(GameState.IN_PROGRESS);

    // And we're on the next round.
    expect(game.round).toEqual(2);
  });

  it('ends the game if we finish the fourth round', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.forceGameState(makeGame(
        '', 4, {'p0': 'RC', 'p1': 'RR', 'p2': 'RS', 'p3': 'RR'},
        'SSSRRRRRRRRR'));
    facade.setInvestigator('', 'p0');
    facade.investigate('', 'p0', 'p1', 1).subscribe();
    facade.investigate('', 'p1', 'p2', 1).subscribe();
    facade.investigate('', 'p2', 'p3', 1).subscribe();
    facade.investigate('', 'p3', 'p0', 1).subscribe();

    const gameSubject = new BehaviorSubject(null);
    facade.getGame('').subscribe(gameSubject);
    const game = gameSubject.value;

    // The game is in-progress still.
    expect(game.state).toEqual(GameState.CULTISTS_WON);

    // And we're on the next round.
    expect(game.round).toEqual(4);
  });

  it('lets users go back and forth', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.forceGameState(makeGame(
        'gameThread', 1, {
          'p1@google.com': 'SSRRR',
          'p2@google.com': 'RRRRR',
          'p3@google.com': 'SSRRR',
          'p4@google.com': 'RRRRC',
        },
        ''));
    facade.setInvestigator('gameThread', 'p1@google.com').subscribe();
    facade.investigate('gameThread', 'p1@google.com', 'p3@google.com', 1).subscribe();
    facade.investigate('gameThread', 'p3@google.com', 'p1@google.com', 1).subscribe();
    facade.investigate('gameThread', 'p1@google.com', 'p3@google.com', 1).subscribe();
    facade.investigate('gameThread', 'p3@google.com', 'p1@google.com', 1).subscribe();

    const gameSubject = new BehaviorSubject(null);
    facade.getGame('gameThread').subscribe(gameSubject);
    const game = gameSubject.value;

    // The game is in-progress still.
    expect(game.state).toEqual(GameState.INVESTIGATORS_WON);

    // And we're on the next round.
    expect(game.round).toEqual(1);
  });
});

describe('Subscribe', () => {
  it('triggers at major events', () => {
    const gameStates = [];

    const facade = new GameFacade(new InMemoryGameStore());
    facade.createGame('id', 'player1').subscribe();
    facade.subscribeToGame('id', {
      next: (game) => gameStates.push(game),
      error: (error) => {
        throw error;
      },
      complete: () => {
      }
    });

    facade.joinGame('id', 'p1').subscribe();
    facade.joinGame('id', 'p2').subscribe();
    facade.joinGame('id', 'p3').subscribe();
    facade.joinGame('id', 'p4').subscribe();
    facade.startGame('id').subscribe();
    facade.forceGameState(makeGame(
        'id', 1, {
          'p1': 'SSRRR',
          'p2': 'RRRRR',
          'p3': 'SSRRR',
          'p4': 'RRRRC',
        },
        ''));
    facade.setInvestigator('id', 'p1').subscribe();
    facade.investigate('id', 'p1', 'p4', 5).subscribe();

    expect(gameStates.length).toBe(8);
  });
});
