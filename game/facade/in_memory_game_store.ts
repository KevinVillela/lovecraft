import {Game, GameId, GameStore, Player} from '../models/models';
import {BehaviorSubject, Observer, of} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

/**
 * A GameStore that keeps the entire state of the game in memory.
 */
export class InMemoryGameStore implements GameStore {
  private readonly games: Record<string, Game> = {};
  private gameSubjects = new Map<GameId, BehaviorSubject<Game>>();

  gameForId(gameId: string) {
    return of(this.games[gameId]);
  }

  allGames() {
    return of(this.games);
  }

  setGameForId(gameId: string, game: Game) {
    this.games[gameId] = game;
  }

  addPlayerToGame(gameId: string, player: Player) {
    this.games[gameId].playerList.push(player);
  }

  subscribeToGame(gameId: string, observer: Observer<Game>) {
    const game = this.getGameCopy(gameId);
    if (!this.gameSubjects.has(gameId)) {
      this.gameSubjects.set(gameId, new BehaviorSubject(game));
    }

    // Only emit when things changed using deep equality.
    this.gameSubjects.get(gameId)
        .pipe(distinctUntilChanged((x: Game, y: Game) => {
          return JSON.stringify(x) == JSON.stringify(y);
        }))
        .subscribe(observer);
  }

  notify(gameId: GameId) {
    // Make a deep copy of the game.
    const game = this.getGameCopy(gameId);
    if (!this.gameSubjects.has(gameId)) {
      return;
    }
    this.gameSubjects.get(gameId).next(game);
  }

  private getGameCopy(gameId: GameId) {
    return JSON.parse(JSON.stringify(this.games[gameId]));
  }
}
