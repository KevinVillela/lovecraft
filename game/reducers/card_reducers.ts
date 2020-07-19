import {PlayCard} from '../actions/actions';
import {Card, Game, GameState, getPlayerOrDie, Player, PlayerId, SecretType} from '../models/models';

import {dealCardsToPlayers} from './utilities';

/**
 * Updates the store given a PlayCard action.
 */
export function onPlayCard(game: Game | undefined, action: PlayCard) {
  if (!game) {
    throw new Error(`No game ${action.gameId} exists.`);
  }
  if (game.state !== GameState.IN_PROGRESS) {
    throw new Error(`${game.id} is not in progress.`);
  }
  const targetPlayer = getPlayerOrDie(game, action.targetPlayer);
  if (action.cardNumber < 1) {
    throw new Error(`Card number must be >= 1.`);
  }
  if (action.cardNumber > targetPlayer.hand.length) {
    throw new Error(
        `${action.targetPlayer} only has ${targetPlayer.hand.length} cards`);
  }
  if (game.currentInvestigatorId !== action.sourcePlayer) {
    throw new Error(`${action.sourcePlayer} is not the current investigator.`);
  }
  if (action.sourcePlayer === action.targetPlayer) {
    throw new Error('You cannot investigate yourself.');
  }

  playCard(game, action.sourcePlayer, action.targetPlayer, action.cardNumber);

  // Add the play to the history.
  game.history.push(action);

  return game;
}


/**
 * Plays a card from a target player's hand in the game provided, updating
 * game state appropriately.
 */
function playCard(
    game: Game, sourcePlayerId: PlayerId, targetPlayerId: PlayerId,
    cardNumber: number) {
  // Find the player or die.
  const player = getPlayerOrDie(game, targetPlayerId);

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

  // Add to the end of the visible card list. This means handleMirage has to
  // move the last card because mirage replaces a card, but this keeps it clean
  // for the other card types.
  game.visibleCards.push(card);

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
    case Card.EVIL_PRESENCE:
      handleEvilPresence(game, player);
      break;
    case Card.MIRAGE:
      handleMirage(game);
      break;
    case Card.PARANOIA:
      handleParanoia(game, targetPlayerId);
      break;
    case Card.PRIVATE_EYE:
      const sourcePlayer = getPlayerOrDie(game, sourcePlayerId);
      handlePrivateEye(game, sourcePlayer, player);
      break;
    default:
      throw new Error(`Invalid card type: ${card}`);
  }

  // Handle an end-of-round situation.
  const roundEnded = handlePotentialEndOfRound(game);

  // If there's a paranoid investigator, give them the flashlight back if we
  // didn't end the round.
  if (game.paranoidPlayerId && !roundEnded) {
    game.currentInvestigatorId = game.paranoidPlayerId;
  } else {
    game.currentInvestigatorId = targetPlayerId;
  }
}

/**
 * Handles someone playing a rock or some other no-op card.
 */
function handleNoOpCard(game: Game, card: Card) {
}

/**
 * Handles someone playing an elder sign.
 */
function handleElderSign(game: Game) {
  let signs = 0;
  for (let card of game.visibleCards) {
    if (card === Card.ELDER_SIGN) {
      signs++;
    }
  }

  if (signs >= game.playerList.length) {
    game.state = GameState.INVESTIGATORS_WON;
  }
}

/**
 * Handles someone playing Cthulhu.
 */
function handleCthulu(game: Game) {
  // If there's still a cthulhu out there, we need to keep going.
  for (const player of game.playerList) {
    for (const card of player.hand) {
      if (card === Card.CTHULHU) {
        return;
      }
    }
  }

  // No more, He rises!
  game.state = GameState.CULTISTS_WON;
}

/**
 * Handles paranoid investigators.
 */
function handleParanoia(game: Game, paranoidPlayerId: PlayerId) {
  game.paranoidPlayerId = paranoidPlayerId;
}

/**
 * The player targeted loses all their cards to the discard pile. Too bad.
 */
function handleEvilPresence(game: Game, player: Player) {
  game.discards.push(...player.hand);
  player.hand = [];
}

/**
 * Causes the last found light to be replaced with mirage.
 */
function handleMirage(game: Game) {
  for (let i = game.visibleCards.length - 1; i >= 0; i--) {
    if (game.visibleCards[i] !== Card.ELDER_SIGN) {
      continue;
    }

    // We found an elder sign. Move it to the game's discards.
    game.discards.push(game.visibleCards[i]);

    // And put mirage in its place, removing it from the end of the visible
    // cards.
    game.visibleCards[i] = Card.MIRAGE;
    game.visibleCards.pop();
    break;
  }

  if (game.round === 4) {
    // You've made a grave mistake by trusting the wrong person!
    game.state = GameState.CULTISTS_WON;
  }
}

/**
 * The source now knows the target's role. OOOoooooOoh, mysterious.
 */
function handlePrivateEye(game: Game, source: Player, target: Player) {
  source.secrets.push({
    type: SecretType.ROLE,
    player: target.id,
    role: target.role,
  });
}

/**
 * Handles any end-of-round activities if we've finished a round, returning true
 * if the round ended.
 */
function handlePotentialEndOfRound(game: Game): boolean {
  if (game.state !== GameState.IN_PROGRESS) {
    return false;
  }

  // We're at the end of a round if the number of cards is a multiple of the
  // number of players.
  if (game.visibleCards.length % game.playerList.length !== 0) {
    return false;
  }

  // See if we were on the last round.
  if (game.round === 4) {
    game.state = GameState.CULTISTS_WON;
    return true;
  }

  // If not, move on to the next round.
  game.round++;

  // Clear the paranoid player.
  game.paranoidPlayerId = undefined;

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
  dealCardsToPlayers(game.playerList, remainingCards);
  return true;
}
