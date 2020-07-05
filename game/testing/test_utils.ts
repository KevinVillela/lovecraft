import {Card, Game, GameId, GameState, Player, PlayerId, Role} from '../models/models';

export class GameBuilder {
  private readonly game: Game;

  constructor(gameId: GameId) {
    this.game = {
      id: gameId,
      round: 0,
      playerList: [],
      currentInvestigatorId: undefined,
      visibleCards: [],
      state: GameState.IN_PROGRESS,
      created: new Date(),
      discards: [],
      history: [],
    };
  }

  setState(state: GameState) {
    this.game.state = state;
    return this;
  }

  addPlayer(id: PlayerId, role = Role.NOT_SET, hand = []) {
    this.game.playerList.push({
      id,
      secrets: [],
      role,
      hand,
    });
    return this;
  }

  build() {
    return this.game;
  }
}

export function makeGame(
    gameId: string, round: number, hands: Record<string, string>,
    visibleCards: string): Game {
  const game: Game = {
    id: gameId,
    round: round,
    playerList: [],
    currentInvestigatorId: undefined,
    visibleCards: [],
    state: GameState.IN_PROGRESS,
    created: new Date(),
    discards: [],
    history: [],
  };

  let playerNum = 0;
  for (const playerId of Object.keys(hands)) {
    const hand = hands[playerId];
    const player: Player = {
      id: playerId,
      role: Role.CULTIST,
      hand: [],
      secrets: [],
    };
    for (let card of hand) {
      player.hand.push(getCardType(card));
    }
    game.playerList.push(player);
    playerNum++;
  }

  for (let card of visibleCards) {
    const type = getCardType(card);
    game.visibleCards.push(type);
  }

  if (game.playerList.length) {
    game.currentInvestigatorId = game.playerList[0].id;
  }
  return game;
}

function getCardType(letter: string): Card {
  switch (letter) {
    case 'C':
      return Card.CTHULHU;
    case 'S':
      return Card.ELDER_SIGN;
    case 'M':
      return Card.MIRAGE;
    case 'E':
      return Card.EVIL_PRESENCE;
    case 'P':
      return Card.PARANOIA;
    case 'I':
      return Card.PRIVATE_EYE;
    default:
      return Card.FUTILE_INVESTIGATION;
  }
}
