import {BehaviorSubject} from 'rxjs';

import {Card, GameState} from '../models/models';
import {makeGame} from '../testing/test_utils';

import {GameFacade} from './facade';
import {InMemoryGameStore} from './in_memory_game_store';

describe('Facade', () => {
  let facade = new GameFacade(new InMemoryGameStore());

  beforeEach(() => {
    facade = new GameFacade(new InMemoryGameStore());
  });

  describe('CreateGame', () => {
    it('creates games in not started state', async () => {
      facade.createGame('id1', 'player1');
      facade.createGame('id2', 'player2');

      const listGames = new BehaviorSubject(null);
      facade.listGames().subscribe(listGames);
      expect(Object.keys(listGames.value)).toEqual(['id1', 'id2']);

      const game1 = await facade.getGame('id1');
      expect(game1.state).toEqual(GameState.NOT_STARTED);

      const game2 = await facade.getGame('id2');
      expect(game2.state).toEqual(GameState.NOT_STARTED);
    });

    it('rejects if the ID exists.', async () => {
      await facade.createGame('id1', 'player1');
      return expectAsync(facade.createGame('id1')).toBeRejected();
    });
  });

  describe('StartGame', () => {
    it('sets a game to in progress', async () => {
      facade.createGame('game1', 'player1');
      facade.joinGame('game1', 'player2');
      facade.joinGame('game1', 'player3');
      facade.joinGame('game1', 'player4');
      facade.startGame('game1');

      const game = await facade.getGame('game1');
      expect(game.state).toEqual(GameState.IN_PROGRESS);
    });

    it('allows up to the max players', async () => {
      await facade.createGame('game1', 'player1');
      for (let i = 0; i < 10; i++) {
        await facade.joinGame('game1', `player2${i + 1}`);
      }
      await expectAsync(facade.startGame('game1')).toBeResolved();

      const game = await facade.getGame('game1');
      expect(game.state).toEqual(GameState.IN_PROGRESS);
    });

    it('does not allow more than max players', async () => {
      await facade.createGame('game1', 'player1');
      for (let i = 0; i < 14; i++) {
        await facade.joinGame('game1', `player2${i + 1}`);
      }
      await expectAsync(facade.startGame('game1')).toBeRejectedWithError(/2-13/);
    });

    it('rejects if the game does not exist.', async () => {
      return expectAsync(facade.joinGame('game1', 'player2')).toBeRejected();
    });
  });

  describe('UpdateGameOptions', () => {
    it('updates a game\'s options', async () => {
      facade.createGame('game1', 'player1');
      facade.updateGameOptions('game1', {cthulhuCount: 1, specialCardCount: 2});

      const game = await facade.getGame('game1');
      expect(game.options).toEqual({cthulhuCount: 1, specialCardCount: 2});
    });

    it('rejects if the game does not exist.', async () => {
      return expectAsync(facade.updateGameOptions('game1', {
        specialCardCount: 1,
        cthulhuCount: 1
      })).toBeRejected();
    });
  });

  describe('RestartGame', () => {
    it('resets a game completely', async () => {
      facade.createGame('game1', 'player1');
      facade.joinGame('game1', 'player2');
      facade.startGame('game1');
      facade.restartGame('game1');

      const game1 = await facade.getGame('game1');
      expect(game1).toEqual(jasmine.objectContaining({
        id: 'game1',
        round: 1,
        visibleCards: [],
        state: GameState.IN_PROGRESS,
      }));
    });

    it('rejects if the game does not exist.', async () => {
      return expectAsync(facade.restartGame('game1')).toBeRejected();
    });
  });

  describe('Investigate', () => {
    it('sets the state correctly on an initial rock pick', async () => {
      facade.forceGameState(makeGame(
          '', 1, {'p0': 'CSRRR', 'p1': 'RRRRR', 'p2': 'SSSRR', 'p3': 'RRRRR'},
          ''));
      facade.setInvestigator('', 'p0');
      facade.investigate('', 'p0', 'p1', 1);
      const game = await facade.getGame('');

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

    it('sets the state correctly on an initial elder sign pick', async () => {
      facade.forceGameState(makeGame(
          '', 1, {'p0': 'CRRRR', 'p1': 'RRRRR', 'p2': 'SSSSR', 'p3': 'RRRRR'},
          ''));
      facade.setInvestigator('', 'p0');
      facade.investigate('', 'p0', 'p2', 1);

      const game = await facade.getGame('');

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

    it('sets the state correctly on an initial Cthulhu pick', async () => {
      facade.forceGameState(makeGame(
          '', 1, {'p0': 'CRRRR', 'p1': 'RRRRR', 'p2': 'SSSSR', 'p3': 'RRRRR'},
          ''));
      facade.setInvestigator('', 'p1');
      facade.investigate('', 'p1', 'p0', 1);

      const game = await facade.getGame('');

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

    it('sets the state correctly on a final elder sign pick', async () => {
      facade.forceGameState(makeGame(
          '', 1, {'p0': 'CRRRR', 'p1': 'RRRRR', 'p2': 'RS', 'p3': 'RRRRR'},
          'SSS'));
      facade.setInvestigator('', 'p0');
      facade.investigate('', 'p0', 'p2', 2);

      const game = await facade.getGame('');

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

    it('moves to the next round when we pick the last card', async () => {
      facade.forceGameState(makeGame(
          '', 1, {'p0': 'RRRRC', 'p1': 'RRRRR', 'p2': 'SSSSR', 'p3': 'RRRRR'},
          ''));
      facade.setInvestigator('', 'p0');
      facade.investigate('', 'p0', 'p1', 1);
      facade.investigate('', 'p1', 'p2', 1);
      facade.investigate('', 'p2', 'p3', 1);
      facade.investigate('', 'p3', 'p0', 1);

      const game = await facade.getGame('');

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

    it('ends the game if we finish the fourth round', async () => {
      facade.forceGameState(makeGame(
          '', 4, {'p0': 'RC', 'p1': 'RR', 'p2': 'RS', 'p3': 'RR'},
          'SSSRRRRRRRRR'));
      facade.setInvestigator('', 'p0');
      facade.investigate('', 'p0', 'p1', 1);
      facade.investigate('', 'p1', 'p2', 1);
      facade.investigate('', 'p2', 'p3', 1);
      facade.investigate('', 'p3', 'p0', 1);

      const game = await facade.getGame('');

      // The game is in-progress still.
      expect(game.state).toEqual(GameState.CULTISTS_WON);

      // And we're on the next round.
      expect(game.round).toEqual(4);
    });

    it('lets users go back and forth', async () => {
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

      const game = await facade.getGame('gameThread');

      // The game is in-progress still.
      expect(game.state).toEqual(GameState.INVESTIGATORS_WON);

      // And we're on the next round.
      expect(game.round).toEqual(1);
    });
  });

  describe('Subscribe', () => {
    it('triggers at major events', async () => {
      const gameStates = [];
      facade.createGame('id', 'player1');
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
});
