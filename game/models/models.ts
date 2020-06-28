/**
 * A unique ID for a player.
 */
import {Observable, Observer} from 'rxjs';

export type PlayerId = string;

/**
 * A unique ID for a game.
 */
export type GameId = string;

/**
 * A DAO for all the games. All operations are synchronous.
 */
export interface GameStore {
  gameForId(gameId: GameId): Observable<Game>;

  setGameForId(gameId: GameId, game: Game);

  allGames(): Observable<Record<string, Game>>;

  addPlayerToGame(gameId: GameId, player: Player): Observable<unknown>;

  subscribeToGame(gameId: GameId, observer: Observer<Game>);

  notify(gameId: GameId): void;
}

/**
 * A single game instance.
 */
export interface Game {
  /** The unique ID for this game. */
  id: GameId;

  /** The current round number, from 1-4. */
  round: number;

  /** The list of players. */
  playerList: Player[];

  /** The current investigator. */
  currentInvestigatorId?: PlayerId;

  /** The cards that have been played already. */
  visibleCards: Card[];

  /** The current state of the game. */
  state: GameState;

  /** When the game was created. */
  created: Date;
}

/**
 * A player in the game.
 */
export interface Player {
  /** The unique identifier for this player. */
  id: PlayerId;

  /** The player's assigned role. */
  role: Role;

  /** The cards in the player's hand. Empty if the game has not begun. */
  hand: Card[];
}

/**
 * The states the game can be in.
 */
export enum GameState {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  INVESTIGATORS_WON = 'Investigators Win',
  CULTISTS_WON = 'Cultists Win',
}

/**
 * The roles players can be assigned.
 */
export enum Role {
  NOT_SET = 'Not set',
  CULTIST = 'Cultist',
  INVESTIGATOR = 'Investigator',
}

/**
 * The cards that can appear in player's hands.
 */
export enum Card {
  FUTILE_INVESTIGATION = 'Rock',
  ELDER_SIGN = 'Light',
  CTHULHU = 'Cthulhu',
  INSANITYS_GRASP = 'Insanity\'s Grasp',
}

/**
 * Gets a player within a game or dies trying.
 */
export function getPlayerOrDie(game: Game, playerId: PlayerId): Player {
  for (const player of game.playerList) {
    if (player.id === playerId) {
      return player;
    }
  }
  throw new Error(`No player with ID ${playerId} in game ${game.id}`);
}
