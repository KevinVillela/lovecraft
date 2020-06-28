import {Injectable} from '@angular/core';
import {GameFacade} from '../../../../game/facade/facade';
import {Game, GameId, Player} from '../../../../game/models/models';
import {error, StatusAnd, wrap} from '../common/status_and';
import {Observable, Observer, of} from 'rxjs';
import {take} from 'rxjs/operators';
import {AngularFireAuth} from '@angular/fire/auth';

/**
 * This provides an interface to the state of the game itself. In the current
 * design of the game, it simply proxies all calls through to the GameStore,
 * because there are no servers - everything is done by calling the Firestore DB directly.
 * However, it could also be used as the RPC interface to some backend.
 */
@Injectable({
  providedIn: 'root'
})
export class GameService {
  username = '';

  constructor(private readonly gameFacade: GameFacade,
              private readonly auth: AngularFireAuth) {
    this.auth.user.subscribe(value => {
      this.username = value?.displayName || '';
    });
  }

  /**
   * Starts a new game.
   *
   * @export
   */
  createGame(gameId: GameId): Observable<StatusAnd<void>> {
    try {
      return this.gameFacade.createGame(gameId, this.username).pipe(wrap);
    } catch (e) {
      return of(error(e));
    }
  }

  listGamesStream(): Observable<StatusAnd<Record<string, Game>>> {
    return this.gameFacade.listGames().pipe(wrap);
  }

  joinGame(gameId: GameId) {
    return this.gameFacade.joinGame(gameId, this.username).pipe(take(1), wrap);
  }

  subscribeToGame(gameId: GameId, observable: Observer<Game>) {
    this.gameFacade.subscribeToGame(gameId, observable);
  }

  startGame(gameId: GameId) {
    return this.gameFacade.startGame(gameId).pipe(take(1), wrap);
  }

  investigate(gameId: GameId, target: Player, cardIndex: number) {
    return this.gameFacade.investigate(gameId, this.username, target.id, cardIndex).pipe(take(1), wrap);
  }
}
