import {Injectable} from '@angular/core';
import {Game, GameId, GameStore, Player} from '../../../../game/models/models';
import {map, take} from 'rxjs/operators';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {BehaviorSubject, Observer} from 'rxjs';

/**
 * A GameStore that is powered by Firestore.
 */
@Injectable({
  providedIn: 'root'
})
export class FirestoreGameStore implements GameStore {

  private readonly games: AngularFirestoreCollection<Game>;
  /**
   * All the games from the backend. This observable exists to get the current state of the games as well as to subscribe to future updates.
   */
  private readonly gamesSync = new BehaviorSubject<Record<GameId, Game>>({});

  constructor(firestore: AngularFirestore) {
    this.games = firestore.collection<Game>('games');

    this.games.snapshotChanges().pipe(map(value => {
      const gamesMap: Record<string, Game> = {};
      for (const game of value) {
        gamesMap[game.payload.doc.id] = game.payload.doc.data();
      }
      return gamesMap;
    })).subscribe(this.gamesSync);
  }

  addPlayerToGame(gameId: string, player: Player) {
    return this.gameForId(gameId).pipe(take(1), map(value => {
      const game = getGameCopy(this.gamesSync.value[gameId]);
      game.playerList.push(player);
      return this.setGameForId(gameId, game);
    }));
  }

  allGames() {
    return this.gamesSync;
  }

  gameForId(gameId: string) {
    return this.gamesSync.pipe(map(value => {
      if (value[gameId]) {
        return value[gameId];
      }
      return null;
    }));
  }

  setGameForId(gameId: string, game: Game) {
    const gameCopy = getGameCopy(game);
    delete gameCopy.id;
    delete gameCopy.visibleElderSigns;
    if (!gameCopy.currentInvestigatorId) {
      delete gameCopy.currentInvestigatorId;
    }
    this.games.doc(gameId).set(gameCopy);
  }

  notify(gameId: string): void {
    // No-op - the application listens to the DB directly.
  }

  subscribeToGame(gameId: string, observer: Observer<Game>) {
    this.gameForId(gameId).subscribe(observer);
  }
}


function getGameCopy(game: Game) {
  return JSON.parse(JSON.stringify(game));
}
