import {BaseHarnessFilters, ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {CardImage} from '../play.component';
import {PlayerId} from '../../../../../game/models/models';

export class PlayComponentHarness extends ComponentHarness {
  static hostSelector = 'app-play';

  private readonly players = this.locatorForAll(PlayerHarness);
  private readonly roleCards = this.locatorForAll('div.role img');
  private readonly playCards = this.locatorForAll('div.play img');
  private readonly pickedCards = this.locatorForAll(CardHarness.with({ancestor: '.visible-cards-round'}));
  private readonly round = this.locatorFor('.round');
  private readonly cultists = this.locatorFor('.cultists');
  private readonly remaining = this.locatorFor('.picked-remaining');
  private readonly elderPicked = this.locatorFor('.elder-signs');
  private readonly mirage = this.locatorFor('.mirage-picked');

  async getPlayCards(): Promise<any[]> {
    const playCards = await this.playCards();
    const images = [];
    for (const playCard of playCards) {
      images.push({image: await playCard.getAttribute('src')});
    }
    return images;
  }

  async getRoleCards(): Promise<{ image: CardImage }[]> {
    const roleCards = await this.roleCards();
    const images = [];
    for (const roleCard of roleCards) {
      images.push({image: await roleCard.getAttribute('src')});
    }
    return images;
  }

  async pickCardFromPlayer(playerId: PlayerId, cardIndex: number) {
    const player = await this.playerForId(playerId);
    await player.investigate(cardIndex);
  }

  async getInvestigator() {
    const players = await this.players();
    for (const player of players) {
      if ((await player.isInvestigator())) {
        return player.getPlayerName();
      }
    }
  }

  /** Returns true if the given player has a highlight border. */
  async isHighlighted(playerId: PlayerId) {
    const player = await this.playerForId(playerId);
    return player.isHighlighted();
  }

  async roleForPlayer(playerId: PlayerId): Promise<CardImage> {
    const player = await this.playerForId(playerId);
    return player.getRoleImage();
  }

  private async playerForId(playerId: PlayerId) {
    const players = await this.players();
    for (const player of players) {
      if ((await player.getPlayerName()) === playerId) {
        return player;
      }
    }
    throw new Error(`Unable to find player with ID ${playerId}`);
  }

  async isCardMagnifified(playerId: PlayerId, cardIndex: number) {
    const player = await this.playerForId(playerId);
    return player.isCardMagnified(cardIndex);
  }

  /**
   * Returns the previously picked card of the given index in the given round.
   */
  async pickedCard(cardIndex: number) {
    return (await this.pickedCards())[cardIndex];
  }

  async getCultists() {
    const cultists = await this.cultists();
    return cultists.text();
  }

  async getRound() {
    const round = await this.round();
    return round.text();
  }

  async getRemaining() {
    const remaining = await this.remaining();
    return remaining.text();
  }

  async elderSignedPicked() {
    const elderPicked = await this.elderPicked();
    return elderPicked.text();
  }

  async miragePicked() {
    const miragePicked = await this.mirage();
    return miragePicked.text();
  }
}

class CardHarness extends ComponentHarness {
  static hostSelector = '.card';

  static with(options: BaseHarnessFilters): HarnessPredicate<CardHarness> {
    return new HarnessPredicate(CardHarness, options);
  }

  async isMagnified() {
    return (await this.host()).hasClass('magnified');
  }

  async click() {
    await (await this.host()).click();
  }
}

class PlayerHarness extends ComponentHarness {
  static hostSelector = 'div.player';

  private readonly roleCard = this.locatorFor('.role img');
  private readonly playerName = this.locatorFor('.player-name');
  private readonly cards = this.locatorForAll(CardHarness.with({selector: '.play'}));
  private readonly investigatorCard = this.locatorForOptional('.investigator');

  async getPlayerName() {
    const playerName = await this.playerName();
    return playerName.text();
  }

  async investigate(cardIndex: number) {
    const cards = await this.cards();
    await cards[cardIndex].click();
  }

  async isInvestigator() {
    return !!(await this.investigatorCard())
  }

  async getRoleImage(): Promise<CardImage> {
    const roleCard = await this.roleCard();
    return roleCard.getAttribute('src') as Promise<CardImage>;
  }

  async isCardMagnified(cardIndex: number) {
    const cards = await this.cards();
    return cards[cardIndex].isMagnified();
  }

  async isHighlighted(): Promise<boolean> {
    const host = await this.host();
    return host.hasClass('highlight');
  }
}
