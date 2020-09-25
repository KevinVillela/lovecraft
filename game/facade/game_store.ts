import {Observable} from 'rxjs';

import {Game, GameId, Player} from '../models/models';

/**
 * A function that takes in a game and returns a new version of the game.
 */
export type GameReducer = (game: Game|undefined) => Game;

/**
 * A DAO for game state. All actions here are asynchronous; callers that care
 * about ordering should ensure that they wait for completion before issuing
 * new store commands, especially since there's no concept of optimisitic
 * locking here.
 */
export interface GameStore {
  /**
   * Subscribes to a game. The initial state will be undefined if the game
   * does not yet exist.
   *
   * TODO(dotaguro): Change the name to subscribeToGame().
   */
  gameForId(gameId: GameId): Observable<Game>;

  /**
   * Adds a plaer to the game a game. This is semi-synchronous and if game state has
   * changed should trigger updates to all subscribers listening to this game.
   */
  addPlayerToGame(gameId: GameId, player: Player);

  /**
   * Sets the state of a game. This is semi-synchronous and if game state has
   * changed should trigger updates to all subscribers listening to this game.
   */
  setGameForId(gameId: GameId, game: Game);

  /**
   * Applies a mutation function to the game provided, storing the result in
   * the store in place of the old version. If the game doesn't exist yet, the
   * reducer will get undefined, otherwise it's the old game.
   */
  applyTo(gameId: GameId, reducer: GameReducer) : Promise<void>;

  /**
   * Returns an observable consisting of all games.
   *
   * TODO(dotaguro): Rename? Also, returning an observable of all games seems
   * like a lot of notifications since it'll trigger on any game getting updated
   * and we probably only need to care if a new game gets added.
   */
  allGames(): Observable<Record<GameId, Game>>;
}
