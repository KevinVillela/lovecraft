/**
 * A unique ID for a player.
 */
export type PlayerId = string;

/**
 * A unique ID for a game.
 */
export type GameId = string;

/**
 * An entry in the history log.
 */
export interface HistoryEntry {}

/**
 * Options that can be provided to the game to configure it.
 */
export interface GameOptions {
  /** How many special cards you want. */
  specialCardCount: number;

  /** How many cthulhus you want. */
  cthulhuCount: number;
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

  /** All the things that have happened for this game. */
  history: HistoryEntry[];

  /** All the discarded cards from this round. */
  discards: Card[];

  /** The ID of a paranoid player, if someone drew paranoia. */
  paranoidPlayerId?: PlayerId,

      /** The current set of options for this game. */
      options?: GameOptions,
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

  /** Any secret information the user knows. */
  secrets: Secret[];
}

/**
 * Things a player knows because of cards they've played.
 */
export type Secret = RoleSecret|CardSecret;

/**
 * Types of secrets.
 */
export enum SecretType {
  ROLE = 'role',
  CARD = 'card',
}

/**
 * The player holding this secret knows another player's role. This secret
 * stays to the end of the game.
 */
export interface RoleSecret {
  type: SecretType.ROLE;

  /**
   * The player whose role is known.
   */
  player: PlayerId;

  /**
   * The role that player has.
   */
  role: Role;
}

/**
 * The player holding this secret knows another player's card. This secret
 * goes away after a round ends.
 */
export interface CardSecret {
  type: SecretType.CARD;

  /**
   * The player holding the card.
   */
  player: PlayerId;

  /**
   * The card they're holding.
   */
  card: Card;

  /**
   * The index in their hand the card is at.
   */
  cardNumber: number;
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
  PRIVATE_EYE = 'Private Eye',
  EVIL_PRESENCE = 'Evil Presence',
  MIRAGE = 'Mirage',
  PARANOIA = 'Paranoia',
  PRESCIENT_VISION = 'Prescient Vision',
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
