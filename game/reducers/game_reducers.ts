import {ForceGameState, JoinGame, NewGame, SetInvestigator, StartGame} from '../actions/actions';
import {Card, Game, GameState, GameStore, getPlayerOrDie, Player, Role} from '../models/models';

import {dealCardsToPlayers, shuffle} from './utilities';

/**
 * Handles a new game action.
 */
export function onNewGame(store: GameStore, action: NewGame) {
  store.setGameForId(action.gameId, {
    id: action.gameId,
    round: 1,
    playerList: [],
    currentInvestigatorId: undefined,
    visibleCards: [],
    visibleElderSigns: 0,
    state: GameState.NOT_STARTED,
  });
}

/**
 * Handles a new player joining the game.
 */
export function onJoinGame(store: GameStore, action: JoinGame) {
  const player = {
    id: action.playerId,
    role: Role.NOT_SET,
    hand: [],
  };

  store.addPlayerToGame(action.gameId, player);
}

/**
 * Handles a start new game action.
 */
export function onStartGame(store: GameStore, action: StartGame) {
  startGame(store.gameForId(action.gameId));
}

/**
 * Handles a force game state action.
 */
export function onForceGameState(store: GameStore, action: ForceGameState) {
  store.setGameForId(action.game.id, action.game);
}

/**
 * Handles a set investigator action.
 */
export function onSetInvestigator(store: GameStore, action: SetInvestigator) {
  const game = store.gameForId(action.gameId);
  game.currentInvestigatorId = getPlayerOrDie(game, action.targetPlayer).id;
}

/**
 * Handles the state transition to the game starting.
 */
export function startGame(game: Game) {
  const setup = PLAYER_SETUPS[game.playerList.length];
  if (!setup) {
    throw new Error(`Invalid player count: ${game.playerList.length}`);
  }

  // Set the starting player.
  const startingPlayer = Math.floor(Math.random() * game.playerList.length);
  game.currentInvestigatorId = game.playerList[startingPlayer].id;

  // Assign roles and generate the initial starting hands.
  assignRoles(game.playerList, setup);
  generateInitialHands(game.playerList, setup);

  // Start the game.
  game.state = GameState.IN_PROGRESS;
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
function generateInitialHands(players: Player[], setup: PlayerSetup) {
  const cards: Card[] = [];
  addValues(cards, Card.CTHULHU, setup.cthulhus);
  addValues(cards, Card.ELDER_SIGN, setup.elderSigns);
  addValues(cards, Card.FUTILE_INVESTIGATION, setup.rocks);

  // Add a fixed percent chance of insanity's grasp. Long term we'll want
  // this configurable and we'll deal in X number of special cards chosen
  // at random.
  if (Math.random() < .5) {
    cards[cards.length - 1] = Card.INSANITYS_GRASP;
  }

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
  rocks: number;
  elderSigns: number;
  cthulhus: number;
}

/**
 * The initial player setups for different numbers of players.
 */
const PLAYER_SETUPS: Record<number, PlayerSetup> = {
  2: {investigators: 1, cultists: 1, rocks: 7, elderSigns: 2, cthulhus: 1},
  3: {investigators: 2, cultists: 1, rocks: 11, elderSigns: 3, cthulhus: 1},
  4: {investigators: 3, cultists: 2, rocks: 15, elderSigns: 4, cthulhus: 1},
  5: {investigators: 4, cultists: 2, rocks: 19, elderSigns: 5, cthulhus: 1},
  6: {investigators: 4, cultists: 2, rocks: 23, elderSigns: 6, cthulhus: 1},
  7: {investigators: 5, cultists: 3, rocks: 27, elderSigns: 7, cthulhus: 1},
  8: {investigators: 6, cultists: 3, rocks: 31, elderSigns: 8, cthulhus: 1},
};
