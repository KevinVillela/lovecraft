import {Game, GameState, getPlayerOrDie, Role} from './models';

test('getPlayerOrDie dies if no player', () => {
  const game: Game = {
    id: '',
    round: 1,
    playerList: [],
    currentInvestigatorId: undefined,
    visibleCards: [],
    visibleElderSigns: 0,
    state: GameState.NOT_STARTED,
  };
  expect(() => getPlayerOrDie(game, 'foo')).toThrow();
});

test('getPlayerOrDie returns the player', () => {
  const game: Game = {
    id: '',
    round: 1,
    playerList: [{id: 'foo', hand: [], role: Role.CULTIST}],
    currentInvestigatorId: undefined,
    visibleCards: [],
    visibleElderSigns: 0,
    state: GameState.NOT_STARTED,
  };
  expect(getPlayerOrDie(game, 'foo'))
      .toEqual({id: 'foo', hand: [], role: Role.CULTIST});
});
