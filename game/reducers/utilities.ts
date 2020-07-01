import {Card, Player} from '../models/models';

/**
 * Fisher-yates shuffle of the array. In-place.
 */
export function shuffle<T>(array: Array<T>) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  while (0 !== currentIndex) {
    // Grab a random index.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // Swap'm.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
}

/**
 * Shuffles and deals the cards evenly to all players, starting with the first
 * player.
 */
export function dealCardsToPlayers(players: Player[], cards: Card[]) {
  shuffle(cards);

  for (const player of players) {
    player.hand = [];
  }

  while (cards.length) {
    for (const player of players) {
      player.hand.push(cards.pop() as Card);
      if (!cards.length) {
        return;
      }
    }
  }
}
