import {BehaviorSubject} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

import {Game, GameId} from '../models/models';

import {GameReducer, GameStore} from './game_store';

/**
 * A GameStore that keeps the entire state of the game in memory.
 */
export class InMemoryGameStore implements GameStore {
  private readonly games: Record<GameId, Game> = {};

  private gamesSubject = new BehaviorSubject<Record<GameId, Game>>({});
  private gameSubjects = new Map<GameId, BehaviorSubject<Game>>();

  /**
   * @override
   */
  gameForId(gameId: GameId) {
    if (!this.gameSubjects.has(gameId)) {
      this.gameSubjects.set(gameId, new BehaviorSubject(undefined));
    }

    // Only emit when things changed using deep equality.
    // TODO(dotaguro): This might not actually be necessary, but it's also
    // probably not so expensive it matters.
    return this.gameSubjects.get(gameId).pipe(
        distinctUntilChanged(deepEquality));
  }

  /**
   * Applies a reducer to an existing game.
   */
  applyTo(gameId: GameId, reducer: GameReducer) {
    const game = this.games[gameId] ? deepCopy(this.games[gameId]) : undefined;
    try {
      const newVersion = reducer(game);
      this.setGameForId(gameId, newVersion);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * @override
   */
  allGames() {
    // TODO(dotaguro): This might not actually be necessary, but it's also
    // probably not so expensive it matters.
    return this.gamesSubject.pipe(distinctUntilChanged(deepEquality));
  }

  /**
   * @override
   */
  setGameForId(gameId: string, game: Game) {
    this.games[gameId] = game;
    const copy = deepCopy(this.games[gameId]);

    // Don't replace the existing subject if it already exists in case of
    // restarts.
    if (!this.gameSubjects.has(gameId)) {
      this.gameSubjects.set(gameId, new BehaviorSubject(copy));
    }

    this.notify(gameId);
  }

  private notify(gameId: GameId) {
    // Make a deep copy of all games to prevent downstream mutation.
    const games = deepCopy(this.games);

    // Notify global listeners that a game has updated.
    this.gamesSubject.next(games);

    // Notify subscribers to the game.
    const game = games[gameId];
    if (game) {
      this.gameSubjects.get(gameId).next(game);
    }
  }
}

/**
 * Compares the contents of two things using deep equality.
 */
function deepEquality<T>(x: T, y: T) {
  return JSON.stringify(x) == JSON.stringify(y);
}

/**
 * Quick and dirty copy to prevent evil people from mutating downstream.
 */
function deepCopy<T>(obj: T): T {
  if (obj == undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(obj));
}
