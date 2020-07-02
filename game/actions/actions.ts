import {Game, GameId, GameOptions, HistoryEntry, PlayerId} from '../models/models';

export enum ActionType {
  NEW_GAME = '[Game] New Game',
  JOIN_GAME = '[Game] Join Game',
  START_GAME = '[Game] Start Game',
  RESTART_GAME = '[Game] Restart Game',
  SET_INVESTIGATOR = '[Game] Set Investigator',
  FORCE_GAME_STATE = '[Game] Force State',
  PLAY_CARD = '[Card] Play Card',
}

export interface Action extends HistoryEntry {
  type: string;
}

export class NewGame implements Action {
  type = ActionType.NEW_GAME;
  constructor(
      public gameId: GameId, public options?: GameOptions,
      public playerId?: PlayerId) {}
}

export class JoinGame implements Action {
  type = ActionType.JOIN_GAME;
  constructor(public gameId: GameId, public playerId: PlayerId) {}
}

export class StartGame implements Action {
  type = ActionType.START_GAME;
  constructor(public gameId: GameId) {}
}

export class RestartGame implements Action {
  type = ActionType.RESTART_GAME;
  constructor(public gameId: GameId) {}
}

export class PlayCard implements Action {
  type = ActionType.PLAY_CARD;
  constructor(
      public gameId: GameId, public sourcePlayer: PlayerId,
      public targetPlayer: PlayerId, public cardNumber: number) {}
}

export class SetInvestigator implements Action {
  type = ActionType.SET_INVESTIGATOR;
  constructor(public gameId: GameId, public targetPlayer: PlayerId) {}
}

export class ForceGameState implements Action {
  type = ActionType.FORCE_GAME_STATE;
  constructor(public game: Game) {}
}
