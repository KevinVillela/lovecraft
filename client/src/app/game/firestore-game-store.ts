import {Injectable} from '@angular/core';
import {Card, Game, GameId, GameOptions, GameState, Player, PlayerId} from '../../../../game/models/models';
import {distinctUntilChanged, map, take} from 'rxjs/operators';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {BehaviorSubject, Observable, Observer} from 'rxjs';
import * as firebase from 'firebase';
import {GameReducer, GameStore} from '../../../../game/facade/game_store';
import FieldValue = firebase.firestore.FieldValue;

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

  /** All the discarded cards from this round. */
  discards: Card[];

  /** The ID of a paranoid player, if someone drew paranoia. */
  paranoidPlayerId?: PlayerId;

  /** The current set of options for this game. */
  options?: GameOptions;
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
          // Firestore is not a big fan of trying to write JS Classes, so we don't use History for now.
          history: [],
        };
      }
      return gamesMap;
    })).subscribe(this.gamesSync);
  }

  allGames(): BehaviorSubject<Record<GameId, Game>> {
    return this.gamesSync;
  }

  applyTo(gameId: GameId, reducer: GameReducer): Promise<void> {
    // I feel like there's something not right here, but I can't test it to
    // see what's funky.
    return this.gameForId(gameId).pipe(take(1), map(game => {
      const newGame = reducer(game);
      this.setGameForId(gameId, newGame);
    })).toPromise();
  }

  gameForId(gameId: string): Observable<Game | null> {
    return this.gamesSync.pipe(map(value => {
          if (value[gameId]) {
            return value[gameId];
          }
          return null;
        }),
        distinctUntilChanged(deepEquality));
  }

  addPlayerToGame(gameId: string, player: Player) {
    this.games.doc(gameId).update({
      playerList: FieldValue.arrayUnion(player),
    })
  }

  setGameForId(gameId: string, game: Game): Promise<void> {
    const firestoreGame: FirestoreGame = {
      created: firebase.firestore.Timestamp.fromDate(game.created),
      currentInvestigatorId: game.currentInvestigatorId,
      playerList: game.playerList,
      round: game.round,
      state: game.state,
      visibleCards: game.visibleCards,
      discards: game.discards,
      options: game.options,
      paranoidPlayerId: game.paranoidPlayerId
    };
    // Firestore doesn't like undefined...
    Object.keys(firestoreGame).forEach(key => firestoreGame[key] === undefined ? delete firestoreGame[key] : {});
    return this.games.doc<FirestoreGame>(gameId).set(firestoreGame);
  }

  notify(gameId: string): void {
    // No-op - the application listens to the DB directly.
  }

  subscribeToGame(gameId: string, observer: Observer<Game>): void {
    this.gameForId(gameId).subscribe(observer);
  }
}

/**
 * Compares the contents of two things using deep equality.
 */
function deepEquality<T>(x: T, y: T) {
  return JSON.stringify(x) == JSON.stringify(y);
}
