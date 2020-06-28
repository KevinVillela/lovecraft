import {PlayCard} from '../actions/actions';
import {Card, Game, GameId, GameState, GameStore, getPlayerOrDie, PlayerId} from '../models/models';

import {dealCardsToPlayers} from './utilities';
import {map, take} from 'rxjs/operators';

/**
 * Updates the store given a PlayCard action.
 */
export function onPlayCard(store: GameStore, action: PlayCard) {
  return store.gameForId(action.gameId).pipe(take(1), map(game => {
    return playCard(store, action.gameId, game, action.targetPlayer, action.cardNumber);
  }));
}


/**
 * Plays a card from a target player's hand in the game provided, updating
 * game state appropriately.
 */
function playCard(store: GameStore, gameId: GameId, game: Game, playerId: PlayerId, cardNumber: number) {
  // Find the player or die.
  const player = getPlayerOrDie(game, playerId);

  // Card indexes are 0 based, but the card number is 1 based.
  const cardIndex = cardNumber - 1;
  // Ignore attempts to play bogus cards.
  if (cardIndex < 0 || cardIndex >= player.hand.length) {
    return;
  }

  // Remove the card. Card number is 1 indexed, so subtract one.
  const newHand = [...player.hand];
  const [card] = newHand.splice(cardIndex, 1);
  player.hand = newHand;

  // The new current investigator is the person who was investigated.
  game.currentInvestigatorId = player.id;

  // Act on the card.
  switch (card) {
    case Card.CTHULHU:
      handleCthulu(game);
      break;
    case Card.ELDER_SIGN:
      handleElderSign(game);
      break;
    case Card.FUTILE_INVESTIGATION:
    case Card.INSANITYS_GRASP:
      handleNoOpCard(game, card);
      break;
    default:
      throw new Error(`Invalid card type: ${card}`);
  }
  return store.setGameForId(gameId, game);
}

/**
 * Handles someone playing a rock or some other no-op card.
 */
function handleNoOpCard(game: Game, card: Card) {
  game.visibleCards.push(card);
  handlePotentialEndOfRound(game);
}

/**
 * Handles someone playing an elder sign.
 */
function handleElderSign(game: Game) {
  game.visibleCards.push(Card.ELDER_SIGN);
  if (elderSignsForGame(game) >= game.playerList.length) {
    game.state = GameState.INVESTIGATORS_WON;
  } else {
    handlePotentialEndOfRound(game);
  }
}

function elderSignsForGame(game: Game): number {
  return game.visibleCards.filter(card => card === Card.ELDER_SIGN).length;
}
/**
 * Handles someone playing Cthulhu.
 */
function handleCthulu(game: Game) {
  game.visibleCards.push(Card.CTHULHU);
  game.state = GameState.CULTISTS_WON;
}

/**
 * Handles any end-of-round activities if we've finished a round.
 */
function handlePotentialEndOfRound(game: Game) {
  // We're at the end of a round if the number of cards is a multiple of the
  // number of players.
  if (game.visibleCards.length % game.playerList.length !== 0) {
    return;
  }

  // See if we were on the last round.
  if (game.round === 4) {
    game.state = GameState.CULTISTS_WON;
    return;
  }

  // If not, move on to the next round.
  game.round++;

  // Gather up cards from all players.
  const remainingCards = [];
  for (const player of game.playerList) {
    remainingCards.push(...player.hand);
    player.hand = [];
  }

  // Now deal them back out.
  dealCardsToPlayers(game.playerList, remainingCards);
}
