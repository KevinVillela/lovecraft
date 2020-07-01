import {Game, GameState, getPlayerOrDie, Role} from './models';

describe('getPlayerOrDie', () => {
  it('dies if no player', () => {
    const game: Game = {
      id: '',
      round: 1,
      playerList: [],
      currentInvestigatorId: undefined,
      visibleCards: [],
      state: GameState.NOT_STARTED,
      created: new Date(),
    };
    expect(() => getPlayerOrDie(game, 'foo')).toThrow();
  });

  it('returns the player', () => {
    const game: Game = {
      id: '',
      round: 1,
      playerList: [{id: 'foo', hand: [], role: Role.CULTIST}],
      currentInvestigatorId: undefined,
      visibleCards: [],
      state: GameState.NOT_STARTED,
      created: new Date(),
    };
    expect(getPlayerOrDie(game, 'foo'))
        .toEqual({id: 'foo', hand: [], role: Role.CULTIST});
  });
});
