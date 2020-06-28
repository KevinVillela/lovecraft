import {Game, GameState, getPlayerOrDie, Role} from './models';

describe('model', () => {
  it('getPlayerOrDie dies if no player', () => {
    const game: Game = {
      id: '',
      round: 1,
      playerList: [],
      currentInvestigatorId: undefined,
      visibleCards: [],
      created: new Date(),
      state: GameState.NOT_STARTED,
    };
    expect(() => getPlayerOrDie(game, 'foo')).toThrow();
  });

  it('getPlayerOrDie returns the player', () => {
    const game: Game = {
      id: '',
      round: 1,
      playerList: [{id: 'foo', hand: [], role: Role.CULTIST}],
      currentInvestigatorId: undefined,
      visibleCards: [],
      created: new Date(),
      state: GameState.NOT_STARTED,
    };
    expect(getPlayerOrDie(game, 'foo'))
        .toEqual({id: 'foo', hand: [], role: Role.CULTIST});
  });
});
