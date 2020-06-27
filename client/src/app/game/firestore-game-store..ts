import {Injectable} from '@angular/core';
import {Game, GameStore, Player} from '../../../../game/models/models';

@Injectable({
  providedIn: 'root'
})
export class FirestoreGameStore implements GameStore {

  constructor() {
  }

  addPlayerToGame(gameId: string, player: Player) {
  }

  allGames(): Record<string, Game> {
    return undefined;
  }

  gameForId(gameId: string): Game {
    return undefined;
  }

  setGameForId(gameId: string, game: Game) {
  }
}
