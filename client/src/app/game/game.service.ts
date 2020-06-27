import {Injectable} from '@angular/core';
import {GameFacade} from '../../../../game/facade/facade';
import {GameId} from '../../../../game/models/models';
import {error, ready, StatusAnd, wrap} from '../common/status_and';
import {Observable, of} from 'rxjs';

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

  constructor(private readonly gameFacade: GameFacade) {
  }

  /**
   * Starts a new game.
   *
   * @export
   */
  createGame(gameId: GameId): Observable<StatusAnd<GameId>> {
    try {
      this.gameFacade.createGame(gameId);
    } catch (e) {
      return of(error(e));
    }
    return of(ready(gameId));
  }

  listGamesStream(): Observable<StatusAnd<GameId[]>> {
    return of(this.gameFacade.listGames()).pipe(wrap);
  }
}
