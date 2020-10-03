import {Observable, Observer} from 'rxjs';
import {take} from 'rxjs/operators';

import {ForceGameState, JoinGame, NewGame, NextRound, PlayCard, RestartGame, SetInvestigator, StartGame, UpdateGameOptions} from '../actions/actions';
import {Game, GameId, GameOptions, PlayerId} from '../models/models';
import {onPlayCard} from '../reducers/card_reducers';
import {onForceGameState, onJoinGame, onNewGame, onNextRound, onRestartGame, onSetInvestigator, onStartGame, onUpdateGameOptions} from '../reducers/game_reducers';

import {GameStore} from './game_store';

/**
 * A facade object that hides the gory details of the underlying representation
 * of the game server.
 *
 * TODO(dotaguro): Now that we've basically reimplemented a store with async
 * actions, let's just register reducers again instead of calling store.applyTo.
 */
export class GameFacade {
  constructor(private readonly store: GameStore) {
  }

  /**
   * Starts a new game.
   */
  createGame(gameId: GameId, playerId?: PlayerId, gameOptions?: GameOptions):
      Promise<void> {
    // Go ahead and create/replace the game.
    return this.store.applyTo(
        gameId,
        (oldGame: Game) => {
          return onNewGame(
              oldGame, new NewGame(gameId, gameOptions, playerId))
        });
  }

  /**
   * Adds a player to a game.
   */
  joinGame(gameId: GameId, playerId: PlayerId): Promise<void> {
    return this.store.applyTo(gameId, (game: Game) => {
      return onJoinGame(game, new JoinGame(gameId, playerId));
    });
  }

  /**
   * Updates the game to use the given options.
   */
  updateGameOptions(gameId: GameId, options: GameOptions): Promise<void> {
    return this.store.applyTo(gameId, (game: Game) => {
      return onUpdateGameOptions(game, new UpdateGameOptions(gameId, options));
    });
  }

  /**
   * Starts a game, setting up the first hand.
   */
  startGame(gameId: GameId): Promise<void> {
    return this.store.applyTo(gameId, (game: Game) => {
      return onStartGame(game, new StartGame(gameId));
    });
  }

  /**
   * Causes an investigation to occur.
   */
  investigate(
      gameId: GameId, sourcePlayerId: PlayerId, targetPlayerId: PlayerId,
      cardNumber: number): Promise<void> {
    return this.store.applyTo(gameId, (game: Game) => {
      return onPlayCard(
          game,
          new PlayCard(gameId, sourcePlayerId, targetPlayerId, cardNumber));
    });
  }

  /**
   * Restarts the game with the same player list. This resets all other game
   * state.
   */
  restartGame(gameId: GameId): Promise<void> {
    return this.store.applyTo(
        gameId,
        (game: Game) => {
          return onRestartGame(game, new RestartGame(gameId))
        });
  }

  /** Moves the game to the next round if it was paused. */
  nextRound(gameId: GameId) {
    return this.store.applyTo(
        gameId,
        (game: Game) => {
          return onNextRound(game, new NextRound(gameId))
        });
  }

  /**
   * Sets the investigator to a specific player. This is just for testing.
   */
  setInvestigator(gameId: GameId, targetPlayerId: PlayerId): Promise<void> {
    return this.store.applyTo(gameId, (game: Game) => {
      return onSetInvestigator(
          game, new SetInvestigator(gameId, targetPlayerId));
    });
  }

  /**
   * Gets a list of all the games in progress and their states.
   */
  listGames(): Observable<Record<string, Game>> {
    return this.store.allGames();
  }

  /**
   * Subscribes to a game. This gets the entire state of the game whenever
   * the game state changes. Game state emitted from this should not be
   * mutated by observers.
   *
   * Note that since we're not using an immutability library, we don't guarantee
   * reference equality for parts of a game that don't change from one emit
   * to the next.
   */
  subscribeToGame(gameId: GameId, observer: Observer<Game>) {
    this.store.gameForId(gameId).subscribe(observer);
  }

  /**
   * For testing. Forces game state to a specific value.
   */
  forceGameState(game: Game): Promise<void> {
    return this.store.applyTo(game.id, (ignored: Game) => {
      return onForceGameState(game, new ForceGameState(game));
    });
  }

  /**
   * For testing. Returns the game for the relevant ID.
   */
  async getGame(gameId: GameId) {
    return await this.store.gameForId(gameId).pipe(take(1)).toPromise();
  }
}
