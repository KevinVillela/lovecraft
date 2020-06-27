import {makeGame} from '../../testing/test_utils';
import {Card, GameState} from '../models/models';

import {GameFacade} from './facade';
import {InMemoryGameStore} from './in_memory_game_store';

describe('CreateGame', () => {
  it('creates games in not started state', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.createGame('id1');
    facade.createGame('id2');
    expect(facade.listGames()).toEqual(['id1', 'id2']);
    expect(facade.getGame('id1').state).toEqual(GameState.NOT_STARTED);
    expect(facade.getGame('id2').state).toEqual(GameState.NOT_STARTED);
  });

  it('throws on create if the ID exists.', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.createGame('id1');
    expect(() => facade.createGame('id1')).toThrow();
  });
});

describe('StartGame', () => {
  it('sets a game to in progress', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.createGame('game1');
    facade.joinGame('game1', 'player1');
    facade.joinGame('game1', 'player2');
    facade.joinGame('game1', 'player3');
    facade.joinGame('game1', 'player4');
    facade.startGame('game1');
    expect(facade.getGame('game1').state).toEqual(GameState.IN_PROGRESS);
  });
});

describe('StartGame', () => {
  it('sets a game to in progress', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.createGame('game1');
    facade.joinGame('game1', 'player1');
    facade.joinGame('game1', 'player2');
    facade.joinGame('game1', 'player3');
    facade.joinGame('game1', 'player4');
    facade.startGame('game1');
    expect(facade.getGame('game1').state).toEqual(GameState.IN_PROGRESS);
  });
});

describe('Investigate', () => {
  it('sets the state correctly on an initial FUTILE_INVESTIGATION pick', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.forceGameState(makeGame(
        '', 1, {'p0': 'CSRRR', 'p1': 'RRRRR', 'p2': 'SSSRR', 'p3': 'RRRRR'},
        ''));
    facade.setInvestigator('', 'p0');
    facade.investigate('', 'p0', 'p1', 1);

    const game = facade.getGame('');

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
    facade.setInvestigator('', 'p0');
    facade.investigate('', 'p0', 'p2', 1);

    const game = facade.getGame('');

    // The card is in the visible cards now.
    expect(game.visibleCards).toEqual([Card.ELDER_SIGN]);

    // The player's hand is missing a light.
    expect(game.playerList[2].hand).toEqual([
      Card.ELDER_SIGN, Card.ELDER_SIGN, Card.ELDER_SIGN,
      Card.FUTILE_INVESTIGATION
    ]);

    // The player is now the current investigator.
    expect(game.currentInvestigatorId).toEqual('p2');

    // The number of lights is what we expect.
    expect(game.visibleElderSigns).toEqual(1);

    // The game is in-progress still.
    expect(game.state).toBe(GameState.IN_PROGRESS);
  });

  it('sets the state correctly on an initial Cthulhu pick', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.forceGameState(makeGame(
        '', 1, {'p0': 'CRRRR', 'p1': 'RRRRR', 'p2': 'SSSSR', 'p3': 'RRRRR'},
        ''));
    facade.setInvestigator('', 'p1');
    facade.investigate('', 'p1', 'p0', 1);

    const game = facade.getGame('');

    // The card is in the visible cards now.
    expect(game.visibleCards).toEqual([Card.CTHULHU]);

    // The player's hand is missing a Cthulhu.
    expect(game.playerList[0].hand).toEqual([
      Card.FUTILE_INVESTIGATION, Card.FUTILE_INVESTIGATION,
      Card.FUTILE_INVESTIGATION, Card.FUTILE_INVESTIGATION
    ]);

    // The player is now the current investigator.
    expect(game.currentInvestigatorId).toEqual('p0');

    // The number of lights is what we expect.
    expect(game.visibleElderSigns).toEqual(0);

    // The game is in-progress still.
    expect(game.state).toBe(GameState.CULTISTS_WON);
  });

  it('sets the state correctly on a final elder sign pick', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.forceGameState(makeGame(
        '', 1, {'p0': 'CRRRR', 'p1': 'RRRRR', 'p2': 'RS', 'p3': 'RRRRR'},
        'SSS'));
    facade.setInvestigator('', 'p0');
    facade.investigate('', 'p0', 'p2', 2);

    const game = facade.getGame('');

    // The card is in the visible cards now.
    expect(game.visibleCards).toEqual([
      Card.ELDER_SIGN, Card.ELDER_SIGN, Card.ELDER_SIGN, Card.ELDER_SIGN
    ]);

    // The player's hand is missing a light.
    expect(game.playerList[2].hand).toEqual([Card.FUTILE_INVESTIGATION]);

    // The player is now the current investigator.
    expect(game.currentInvestigatorId).toEqual('p2');

    // The number of lights is what we expect.
    expect(game.visibleElderSigns).toEqual(4);

    // The game is in-progress still.
    expect(game.state).toBe(GameState.INVESTIGATORS_WON);
  });

  it('moves to the next round when we pick the last card for a round', () => {
    const facade = new GameFacade(new InMemoryGameStore());
    facade.forceGameState(makeGame(
        '', 1, {'p0': 'RRRRC', 'p1': 'RRRRR', 'p2': 'SSSSR', 'p3': 'RRRRR'},
        ''));
    facade.setInvestigator('', 'p0');
    facade.investigate('', 'p0', 'p1', 1);
    facade.investigate('', 'p1', 'p2', 1);
    facade.investigate('', 'p2', 'p3', 1);
    facade.investigate('', 'p3', 'p0', 1);

    const game = facade.getGame('');

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

    // The number of lights is what we expect.
    expect(game.visibleElderSigns).toEqual(1);

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
    facade.investigate('', 'p0', 'p1', 1);
    facade.investigate('', 'p1', 'p2', 1);
    facade.investigate('', 'p2', 'p3', 1);
    facade.investigate('', 'p3', 'p0', 1);

    const game = facade.getGame('');

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
    facade.setInvestigator('gameThread', 'p1@google.com');
    facade.investigate('gameThread', 'p1@google.com', 'p3@google.com', 1);
    facade.investigate('gameThread', 'p3@google.com', 'p1@google.com', 1);
    facade.investigate('gameThread', 'p1@google.com', 'p3@google.com', 1);
    facade.investigate('gameThread', 'p3@google.com', 'p1@google.com', 1);

    const game = facade.getGame('gameThread');

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
    facade.createGame('id');
    facade.subscribeToGame('id', {
      next: (game) => gameStates.push(game),
      error: (error) => {
        throw error;
      },
      complete: () => {
      }
    });

    facade.joinGame('id', 'p1');
    facade.joinGame('id', 'p2');
    facade.joinGame('id', 'p3');
    facade.joinGame('id', 'p4');
    facade.startGame('id');
    facade.forceGameState(makeGame(
        'id', 1, {
          'p1': 'SSRRR',
          'p2': 'RRRRR',
          'p3': 'SSRRR',
          'p4': 'RRRRC',
        },
        ''));
    facade.setInvestigator('id', 'p1');
    facade.investigate('id', 'p1', 'p4', 5);

    expect(gameStates.length).toBe(8);
  });
});
