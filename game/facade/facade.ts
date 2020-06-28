import {Observable, Observer} from 'rxjs';
import {map, switchMap, take, tap} from 'rxjs/operators';

import {ForceGameState, JoinGame, NewGame, PlayCard, SetInvestigator, StartGame} from '../actions/actions';
import {Game, GameId, GameState, GameStore, getPlayerOrDie, PlayerId} from '../models/models';
import {onPlayCard} from '../reducers/card_reducers';
import {onForceGameState, onJoinGame, onNewGame, onSetInvestigator, onStartGame} from '../reducers/game_reducers';

/**
 * A facade object that hides the gory details of the underlying representation
 * of the game server.
 */
export class GameFacade {

  constructor(private readonly store: GameStore) {
  }

  /**
   * Starts a new game.
   *
   * @export
   */
  createGame(gameId: GameId, playerId: PlayerId) {
    return this.store.gameForId(gameId).pipe(take(1), map(existingGame => {
      if (existingGame && existingGame.state === GameState.NOT_STARTED) {
        throw new Error(`Game ${gameId} already exists.`)
      } else if (existingGame && existingGame.state === GameState.IN_PROGRESS) {
        throw new Error(`Game ${gameId} is in progress.`);
      }

      // Go ahead and create/replace the game.
      return onNewGame(this.store, new NewGame(gameId,playerId));
    }));
  }

  /**
   * Adds a player to a game.
   *
   * @export
   */
  joinGame(gameId: GameId, playerId: PlayerId) {
    return this.getGame(gameId).pipe(take(1), switchMap(existingGame => {
      if (existingGame.playerList.some((player) => player.id === playerId)) {
        throw new Error(`${playerId} is already in ${gameId}`);
      }
      if (existingGame.state !== GameState.NOT_STARTED) {
        throw new Error(`${gameId} is already in progres.`);
      }

      return onJoinGame(this.store, new JoinGame(gameId, playerId));
    }), tap(() => this.notify(gameId)));
  }

  /**
   * Starts a game, setting up the first hand.
   */
  startGame(gameId: GameId): Observable<void> {
    return this.getGame(gameId).pipe(take(1), switchMap(existingGame => {
      if (existingGame.state !== GameState.NOT_STARTED) {
        throw new Error(`${gameId} has already been started.`);
      }
      if (existingGame.playerList.length > 8) {
        throw new Error('We only support 4-8 players at this time.');
      }
      return onStartGame(this.store, new StartGame(gameId));
    }), tap(() => this.notify(gameId)));
  }

  /**
   * Causes an investigation to occur.
   */
  investigate(
      gameId: GameId, sourcePlayerId: PlayerId, targetPlayerId: PlayerId,
      cardNumber: number) {
    return this.getGame(gameId).pipe(take(1), switchMap(game => {
      if (game.state !== GameState.IN_PROGRESS) {
        throw new Error(`${gameId} is not in progress.`);
      }
      const targetPlayer = getPlayerOrDie(game, targetPlayerId);
      if (cardNumber < 1) {
        throw new Error(`Card number must be >= 1.`);
      }
      if (cardNumber > targetPlayer.hand.length) {
        throw new Error(
            `${targetPlayerId} only has ${targetPlayer.hand.length} cards`);
      }
      if (game.currentInvestigatorId !== sourcePlayerId) {
        throw new Error(`${sourcePlayerId} is not the current investigator.`);
      }
      if (sourcePlayerId === targetPlayerId) {
        throw new Error('You cannot investigate yourself.');
      }

      // Play the card. This also sets the current investigator.
      return onPlayCard(this.store, new PlayCard(gameId, targetPlayerId, cardNumber));
    }), tap(() => this.notify(gameId)));
  }

  /**
   * Gets a list of all the games in progress and their states.
   */
  listGames(): Observable<Record<string, Game>> {
    return this.store.allGames();
  }

  /**
   * Gets the current game state. This is for internal use only.
   */
  getGame(gameId: GameId): Observable<Game> {
    const game = this.store.gameForId(gameId);
    if (!game) {
      throw new Error(`No game ${gameId} exists.`);
    }
    return game;
  }

  /**
   * Sets the investigator to a specific player. This is just for testing.
   */
  setInvestigator(gameId: GameId, targetPlayerId: PlayerId) {
    onSetInvestigator(this.store, new SetInvestigator(gameId, targetPlayerId));
    this.notify(gameId);
  }

  /**
   * For testing. Forces game state to a specific value.
   */
  forceGameState(game: Game) {
    onForceGameState(this.store, new ForceGameState(game));
    this.notify(game.id);
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
    this.store.subscribeToGame(gameId, observer);
  }

  /**
   * Notifies when game state changes. This is all manual right now because
   * we've removed all the store logic that would handle this for us, but
   * the surface area is simple enough that that's probably fine.
   */
  private notify(gameId: GameId) {
    this.store.notify(gameId);
  }

  private getGameCopy(gameId: GameId) {
    return JSON.parse(JSON.stringify(this.getGame(gameId)));
  }
}
