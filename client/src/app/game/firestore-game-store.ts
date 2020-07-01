import {Injectable} from '@angular/core';
import {Card, Game, GameId, GameState, Player} from '../../../../game/models/models';
import {map} from 'rxjs/operators';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {BehaviorSubject, Observer} from 'rxjs';
import * as firebase from 'firebase';
import {GameStore, GameReducer} from '../../../../game/facade/game_store';

/** The interface for the data store in FireStore. */
interface FirestoreGame {
  /** The current round number, from 1-4. */
  round: number;

  /** The list of players. */
  playerList: Player[];

  /** The current investigator. */
  currentInvestigatorId?: string;

  /** The cards that have been played already. */
  visibleCards: Card[];

  /** The current state of the game. */
  state: GameState;

  /** When the game was created. */
  created: firebase.firestore.Timestamp;
}

/**
 * A GameStore that is powered by Firestore.
 */
@Injectable({
  providedIn: 'root'
})
export class FirestoreGameStore implements GameStore {

  private readonly games: AngularFirestoreCollection<FirestoreGame>;
  /**
   * All the games from the backend. This observable exists to get the current state of the games as well as to subscribe to future updates.
   */
  private readonly gamesSync = new BehaviorSubject<Record<GameId, Game>>({});

  constructor(firestore: AngularFirestore) {
    this.games = firestore.collection<FirestoreGame>('games');

    this.games.snapshotChanges().pipe(map(value => {
      const gamesMap: Record<string, Game> = {};
      for (const game of value) {
        const doc = game.payload.doc;
        gamesMap[doc.id] = {
          ...doc.data(),
          id: doc.id,
          created: doc.data().created.toDate(),
        };
      }
      return gamesMap;
    })).subscribe(this.gamesSync);
  }

  allGames() {
    return this.gamesSync;
  }

  applyTo(gameId: GameId, reducer: GameReducer) {
    // I feel like there's something not right here, but I can't test it to
    // see what's funky.
    return this.gameForId(gameId).pipe(map(game => {
      const newGame = reducer(game);
      this.setGameForId(gameId, newGame);
    })).toPromise();
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
    const firestoreGame = {
      created: firebase.firestore.Timestamp.fromDate(game.created),
      currentInvestigatorId: game.currentInvestigatorId,
      playerList: game.playerList,
      round: game.round,
      state: game.state,
      visibleCards: game.visibleCards,
    };
    if (!firestoreGame.currentInvestigatorId) {
      // Firestore doesn't like undefined...
      delete firestoreGame.currentInvestigatorId;
    }
    return this.games.doc<FirestoreGame>(gameId).set(firestoreGame);
  }

  notify(gameId: string): void {
    // No-op - the application listens to the DB directly.
  }

  subscribeToGame(gameId: string, observer: Observer<Game>) {
    this.gameForId(gameId).subscribe(observer);
  }
}


function getGameCopy(game: Game): Game {
  return JSON.parse(JSON.stringify(game));
}
