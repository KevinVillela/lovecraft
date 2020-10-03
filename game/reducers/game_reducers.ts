import {ForceGameState, JoinGame, NewGame, NextRound, RestartGame, SetInvestigator, StartGame, UpdateGameOptions} from '../actions/actions';
import {Card, Game, GameOptions, GameState, getPlayerOrDie, Player, Role} from '../models/models';

import {dealCardsToPlayers, shuffle} from './utilities';

/**
 * Handles a new game action.
 */
export function onNewGame(oldGame: Game | undefined, action: NewGame) {
  if (oldGame) {
    throw new Error(`Game ${oldGame.id} already exists.`);
  }

  const game: Game = {
    id: action.gameId,
    round: 1,
    playerList: [],
    currentInvestigatorId: undefined,
    visibleCards: [],
    state: GameState.NOT_STARTED,
    created: new Date(),
    history: [],
    discards: [],
    options: action.options,
  };

  if (action.playerId) {
    onJoinGame(game, new JoinGame(action.gameId, action.playerId));
  }

  // Add the action to the history.
  game.history.push(action);

  return game;
}

/**
 * Handles a new player joining the game.
 */
export function onJoinGame(game: Game | undefined, action: JoinGame) {
  if (!game) {
    throw new Error(`No game ${action.gameId} exists.`);
  }
  if (game.playerList.some((player) => player.id === action.playerId)) {
    throw new Error(`${action.playerId} is already in ${game.id}`);
  }
  if (game.state !== GameState.NOT_STARTED) {
    throw new Error(`${game.id} is already in progres.`);
  }

  const player: Player = {
    id: action.playerId,
    role: Role.NOT_SET,
    hand: [],
    secrets: [],
  };
  game.playerList.push(player);

  // Add the action to the history.
  game.history.push(action);

  return game;
}

/**
 * Handles updating the game options.
 */
export function onUpdateGameOptions(game: Game | undefined, action: UpdateGameOptions) {
  if (!game) {
    throw new Error(`No game ${action.gameId} exists.`);
  }
  if (game.state !== GameState.NOT_STARTED) {
    throw new Error(`${game.id} is already in progress.`);
  }

  game.options = action.options;

  // Add the action to the history.
  game.history.push(action);

  return game;
}

/**
 * Handles a start new game action.
 */
export function onStartGame(game: Game | undefined, action: StartGame) {
  if (!game) {
    throw new Error(`No game ${action.gameId} exists.`);
  }
  if (game.state !== GameState.NOT_STARTED) {
    throw new Error(`${game.id} has already been started.`);
  }
  // Object.keys will always return string[]: https://stackoverflow.com/questions/52856496/typescript-object-keys-return-string
  const setupKeys = Object.keys(PLAYER_SETUPS) as unknown as Array<keyof typeof PLAYER_SETUPS>;
  const minPlayers = Math.min(...setupKeys);
  const maxPlayers = Math.max(...setupKeys);
  if (game.playerList.length > maxPlayers) {
    throw new Error(`We only support ${minPlayers}-${maxPlayers} players at this time.`);
  }

  startGame(game);

  // Add the action to the history.
  game.history.push(action);

  return game;
}

/**
 * Handles a restart new game action.
 */
export function onRestartGame(game: Game | undefined, action: RestartGame) {
  return restartGame(game);
}

/**
 * Handles a next round game action.
 */
export function onNextRound(game: Game | undefined, action: NextRound) {
  return nextRound(game);
}


/**
 * Handles a force game state action.
 */
export function onForceGameState(game: Game | undefined, action: ForceGameState) {
  return action.game;
}

/**
 * Handles a set investigator action.
 */
export function onSetInvestigator(
    game: Game | undefined, action: SetInvestigator) {
  if (!game) {
    throw new Error(`No game ${action.gameId} exists.`);
  }
  game.currentInvestigatorId = getPlayerOrDie(game, action.targetPlayer).id;
  return game;
}

/**
 * Handles the state transition to the game starting.
 */
function startGame(game: Game) {
  const setup = PLAYER_SETUPS[game.playerList.length];
  if (!setup) {
    throw new Error(`Invalid player count: ${game.playerList.length}`);
  }

  // Set the starting player.
  const startingPlayer = Math.floor(Math.random() * game.playerList.length);
  game.currentInvestigatorId = game.playerList[startingPlayer].id;

  // Assign roles and generate the initial starting hands.
  assignRoles(game.playerList, setup);
  generateInitialHands(game.playerList, setup, game.options || DEFAULT_OPTIONS);

  // Start the game.
  game.state = GameState.IN_PROGRESS;
}

/**
 * Restarts the game.
 */
function restartGame(game: Game) {
  // Reset the game to zero.
  const newGame: Game = {
    id: game.id,
    round: 1,
    playerList: game.playerList,
    currentInvestigatorId: undefined,
    visibleCards: [],
    state: GameState.NOT_STARTED,
    created: new Date(),
    history: [],
    discards: [],
    options: game.options,
  };

  // Reset the players to their base state.
  for (let player of game.playerList) {
    player.hand = [];
    player.secrets = [];
    player.role = Role.NOT_SET;
  }

  // Start the game.
  startGame(newGame);
  return newGame;
}

/**
 * Goes to the next round.
 */
function nextRound(game: Game) {
  if (game.state !== GameState.PAUSED) {
    throw new Error(`Game must be paused to go to the next round, but was in state ${game.state}`);
  }

  // Put the game back "in progress" and deal the cards out.
  game.state = GameState.IN_PROGRESS;

  // Gather up cards from all players.
  const remainingCards = [];
  for (const player of game.playerList) {
    remainingCards.push(...player.hand);
    player.hand = [];
  }

  // As well as any discards caused by things like evil presence.
  remainingCards.push(...game.discards);
  game.discards = [];

  // Now deal them back out.
  game.round++;
  dealCardsToPlayers(game.playerList, remainingCards);
  return game;
}

/**
 * Assigns roles to the players.
 */
function assignRoles(players: Player[], setup: PlayerSetup) {
  const roles: Role[] = [];
  addValues(roles, Role.INVESTIGATOR, setup.investigators);
  addValues(roles, Role.CULTIST, setup.cultists);

  shuffle(roles);
  for (const player of players) {
    const role = roles.pop();
    if (!role) {
      throw new Error('Ran out of roles.');
    }
    player.role = role;
  }
}

/**
 * Generates the starting hands for players.
 */
function generateInitialHands(
    players: Player[], setup: PlayerSetup, options: GameOptions) {
  const cards: Card[] = [];

  // Add cthulhu.
  addValues(cards, Card.CTHULHU, options.cthulhuCount);

  // Add elder signs.
  addValues(cards, Card.ELDER_SIGN, setup.elderSigns);

  // Add any special cards.
  const specials = [...SUPPORTED_SPECIAL_CARDS];
  shuffle(specials);
  cards.push(...specials.slice(0, options.specialCardCount));

  // Now fill in cards until we have enough.
  addValues(
      cards, Card.FUTILE_INVESTIGATION, setup.elderSigns * 5 - cards.length);

  // Hand the cards out.
  dealCardsToPlayers(players, cards);
}

/**
 * Adds a bunch of value elements to the end of the array.
 */
function addValues<T>(array: Array<T>, value: T, num: number) {
  for (let i = 0; i < num; i++) {
    array.push(value);
  }
}


/**
 * A configuration for a given number of players.
 */
interface PlayerSetup {
  investigators: number;
  cultists: number;
  elderSigns: number;
}

/**
 * The initial player setups for different numbers of players.
 */
export const PLAYER_SETUPS: Record<number, PlayerSetup> = {
  2: {investigators: 1, cultists: 1, elderSigns: 2},
  3: {investigators: 2, cultists: 1, elderSigns: 3},
  4: {investigators: 3, cultists: 2, elderSigns: 4},
  5: {investigators: 4, cultists: 2, elderSigns: 5},
  6: {investigators: 4, cultists: 2, elderSigns: 6},
  7: {investigators: 5, cultists: 3, elderSigns: 7},
  8: {investigators: 6, cultists: 3, elderSigns: 8},
  9: {investigators: 7, cultists: 3, elderSigns: 9},
  10: {investigators: 7, cultists: 4, elderSigns: 10},
  11: {investigators: 7, cultists: 4, elderSigns: 11},
  12: {investigators: 8, cultists: 4, elderSigns: 12},
  13: {investigators: 8, cultists: 5, elderSigns: 13},
};

/**
 * The special cards we support.
 */
export const SUPPORTED_SPECIAL_CARDS: Card[] = [
  Card.EVIL_PRESENCE, Card.INSANITYS_GRASP, Card.MIRAGE, Card.PARANOIA,
  Card.PRIVATE_EYE
];

/**
 * The default options if the user doesn't specify.
 */
const DEFAULT_OPTIONS: GameOptions = {
  specialCardCount: 0,
  cthulhuCount: 1,
};
