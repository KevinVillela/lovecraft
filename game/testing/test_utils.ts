import {Card, Game, GameState, Player, Role} from '../models/models';

export function makeGame(
    gameId: string, round: number, hands: Record<string, string>,
    visibleCards: string): Game {
  const game: Game = {
    id: gameId,
    round: round,
    playerList: [],
    currentInvestigatorId: undefined,
    visibleCards: [],
    created: new Date(),
    state: GameState.IN_PROGRESS,
  };

  let playerNum = 0;
  for (const playerId of Object.keys(hands)) {
    const hand = hands[playerId];
    const player: Player = {
      id: playerId,
      role: Role.CULTIST,
      hand: [],
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

  game.currentInvestigatorId = game.playerList[0].id;
  return game;
}

function getCardType(letter: string): Card {
  switch (letter) {
    case 'C':
      return Card.CTHULHU;
    case 'S':
      return Card.ELDER_SIGN;
    default:
      return Card.FUTILE_INVESTIGATION;
  }
}
