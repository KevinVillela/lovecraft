import {ComponentHarness} from '@angular/cdk/testing';
import {CardImage} from '../play.component';

export class PlayComponentHarness extends ComponentHarness {
  static hostSelector = 'app-play';

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
}
