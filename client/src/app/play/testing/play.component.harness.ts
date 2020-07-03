import {ComponentHarness} from '@angular/cdk/testing';
import {CardImage} from '../play.component';
import {PlayerId} from '../../../../../game/models/models';

export class PlayComponentHarness extends ComponentHarness {
  static hostSelector = 'app-play';

  private readonly players = this.locatorForAll(PlayerHarness);
  private readonly roleCards = this.locatorForAll('div.role img');
  private readonly playCards = this.locatorForAll('div.play img');

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
}

class PlayerHarness extends ComponentHarness {
  static hostSelector = 'div.player';

  private readonly roleCard = this.locatorFor('.role img');
  private readonly playerName = this.locatorFor('.player-name');
  private readonly cards = this.locatorForAll('.play.card');
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
}
