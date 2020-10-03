import {NextRound, StartGame} from '../actions/actions';
import {Card, GameState} from '../models/models';
import {makeGame} from '../testing/test_utils';

import {onNextRound, onStartGame} from './game_reducers';

describe('game reducers', () => {
  describe('on start game', () => {
    it('one cthulhu and no specials with no options', () => {
      const game = makeGame(
          '', 1, {
            'p2': '',
            'p1': '',
          },
          '');
      game.state = GameState.NOT_STARTED;
      onStartGame(game, new StartGame(game.id));

      const allCards = [...game.playerList[0].hand, ...game.playerList[1].hand];
      expect(allCards.length).toEqual(10);
      expect(countInArray(allCards, Card.CTHULHU)).toEqual(1);
      expect(countInArray(allCards, Card.FUTILE_INVESTIGATION)).toEqual(7);
      expect(countInArray(allCards, Card.ELDER_SIGN)).toEqual(2);
    });

    it('two cthulhu and specials with options', () => {
      const game = makeGame(
          '', 1, {
            'p2': '',
            'p1': '',
          },
          '');
      game.state = GameState.NOT_STARTED;
      game.options = {
        cthulhuCount: 2,
        specialCardCount: 2,
      };
      onStartGame(game, new StartGame(game.id));

      const allCards = [...game.playerList[0].hand, ...game.playerList[1].hand];
      expect(allCards.length).toEqual(10);
      expect(countInArray(allCards, Card.CTHULHU)).toEqual(2);
      expect(countInArray(allCards, Card.FUTILE_INVESTIGATION)).toEqual(4);
      expect(countInArray(allCards, Card.ELDER_SIGN)).toEqual(2);
    });
  });

  describe('on next round', () => {
    it('errs if the game is not paused', () => {
      const game = makeGame(
          '', 1, {
            'p1': 'ER',
            'p2': 'RR',
          },
          'RR');

      expect(() => onNextRound(game, new NextRound(game.id))).toThrowError(/Game must be paused/);
    });

    it('goes to next round when paused', () => {
      const game = makeGame(
          '', 1, {
            'p1': 'ER',
            'p2': 'RR',
          },
          'RR');
      game.state = GameState.PAUSED;

      onNextRound(game, new NextRound(game.id));

      expect(game.state).toEqual(GameState.IN_PROGRESS);
      expect(game.round).toEqual(2);
    });
  });
})
;

function countInArray(arr: Card[], testCard: Card) {
  return arr.reduce((prev: number, card: Card) => {
    return prev + (card === testCard ? 1 : 0);
  }, 0);
}
