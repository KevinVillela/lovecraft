import {PlayCard} from '../actions/actions';
import {Card, Game, GameState, PlayerId, Role, SecretType} from '../models/models';
import {makeGame} from '../testing/test_utils';

import {onPlayCard} from './card_reducers';

function playCard(game: Game, targetPlayer: PlayerId, cardNum: number) {
  const action =
      new PlayCard(game.id, game.currentInvestigatorId, targetPlayer, cardNum);
  onPlayCard(game, action);
}

describe('playCard', () => {
  describe('cthulhu', () => {
    it('triggers end of game with no options', () => {
      const game = makeGame(
          '', 1, {
            'p2': 'RRRR',
            'p1': 'CRRR',
          },
          '');
      playCard(game, 'p1', 1);
      expect(game.state).toEqual(GameState.CULTISTS_WON);
    });

    it('does not end of game with multiple cthulhus', () => {
      const game = makeGame(
          '', 1, {
            'p2': 'RRRR',
            'p1': 'CCRR',
          },
          '');
      playCard(game, 'p1', 1);
      expect(game.state).toEqual(GameState.IN_PROGRESS);
    });

    it('does end the game if this is the last cthulhu', () => {
      const game = makeGame(
          '', 1, {
            'p2': 'RRRR',
            'p1': 'CCRR',
          },
          '');
      game.paranoidPlayerId = 'p2';
      playCard(game, 'p1', 1);
      playCard(game, 'p1', 1);
      expect(game.state).toEqual(GameState.CULTISTS_WON);
    });
  });

  describe('mirage', () => {
    it('appends mirage if there are no lights', () => {
      const game = makeGame(
          '', 1, {
            'p2': 'RRRR',
            'p1': 'MRRR',
          },
          'R');
      playCard(game, 'p1', 1);

      expect(game.visibleCards).toEqual([
        Card.FUTILE_INVESTIGATION, Card.MIRAGE
      ]);
      expect(game.state).toEqual(GameState.IN_PROGRESS);
    });

    it('triggers end of game if mirage is picked on last round', () => {
      const game = makeGame(
          '', 4, {
            'p2': 'RR',
            'p1': 'MR',
          },
          'RRRRRR');
      playCard(game, 'p1', 1);
      expect(game.state).toEqual(GameState.CULTISTS_WON);
    });

    it('replaces a light if there are some', () => {
      const game = makeGame(
          '', 3, {
            'p2': 'RRRR',
            'p1': 'MRRR',
          },
          'SRSR');
      playCard(game, 'p1', 1);
      expect(game.visibleCards).toEqual([
        Card.ELDER_SIGN,
        Card.FUTILE_INVESTIGATION,
        Card.MIRAGE,
        Card.FUTILE_INVESTIGATION,
      ]);
      // Ensure the round doesn't get incremented
      // (Test for https://github.com/KevinVillela/lovecraft/issues/14).
      expect(game.round).toEqual(3);
    });
  });

  describe('evil presence', () => {
    it('junks the players hand', () => {
      const game = makeGame(
          '', 1, {
            'p1': 'RR',
            'p2': 'ER',
          },
          '');
      playCard(game, 'p2', 1);
      expect(game.visibleCards).toEqual([Card.EVIL_PRESENCE]);
      expect(game.playerList[1].hand).toEqual([]);
      expect(game.discards).toEqual([Card.FUTILE_INVESTIGATION]);
    });

    it('triggers a new round if played at the end', () => {
      const game = makeGame(
          '', 1, {
            'p1': 'ER',
            'p2': 'RR',
          },
          '');
      playCard(game, 'p2', 1);
      playCard(game, 'p1', 1);
      expect(game.visibleCards).toEqual([
        Card.FUTILE_INVESTIGATION, Card.EVIL_PRESENCE
      ]);
      expect(game.round).toEqual(2);
      expect(game.discards).toEqual([]);
    });
  });

  describe('paranoia', () => {
    it('keeps the current investigator until the end of round', () => {
      const game = makeGame(
          '', 1, {
            'p1': 'RRRRR',
            'p2': 'PRRRR',
            'p3': 'RRRRR',
            'p4': 'RRRRR',
          },
          '');
      playCard(game, 'p2', 1);
      expect(game.paranoidPlayerId).toEqual('p2');
      expect(game.currentInvestigatorId).toEqual('p2');

      playCard(game, 'p1', 1);
      expect(game.paranoidPlayerId).toEqual('p2');
      expect(game.currentInvestigatorId).toEqual('p2');

      playCard(game, 'p1', 1);
      expect(game.paranoidPlayerId).toEqual('p2');
      expect(game.currentInvestigatorId).toEqual('p2');

      playCard(game, 'p1', 1);
      expect(game.paranoidPlayerId).toBeUndefined();
      expect(game.currentInvestigatorId).toEqual('p1');

      expect(game.visibleCards).toEqual([
        Card.PARANOIA, Card.FUTILE_INVESTIGATION, Card.FUTILE_INVESTIGATION,
        Card.FUTILE_INVESTIGATION
      ]);
      expect(game.round).toEqual(2);
    });
  });

  describe('private eye', () => {
    it('adds to the secrets for the picking player', () => {
      const game = makeGame(
          '', 1, {
            'p1': 'RRRRR',
            'p2': 'IRRRR',
          },
          '');

      playCard(game, 'p2', 1);
      expect(game.playerList[0].secrets).toEqual([{
        type: SecretType.ROLE,
        player: 'p2',
        role: Role.CULTIST,
      }]);
      expect(game.visibleCards).toEqual([Card.PRIVATE_EYE]);
    });
  });
});
