import {Game, GameStore, Player} from '../models/models';

/**
 * A GameStore that keeps the entire state of the game in memory.
 */
export class InMemoryGameStore implements GameStore {
  private readonly games: Record<string, Game> = {};

  gameForId(gameId: string): Game {
    return this.games[gameId];
  }

  allGames(): Record<string, Game> {
    return this.games;
  }

  setGameForId(gameId: string, game: Game) {
    this.games[gameId] = game;
  }

  addPlayerToGame(gameId: string, player: Player) {
    this.games[gameId].playerList.push(player);
  }

}
