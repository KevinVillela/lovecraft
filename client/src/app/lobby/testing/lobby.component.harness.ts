import {ComponentHarness} from '@angular/cdk/testing';
import {MatListItemHarness} from '@angular/material/list/testing';
import {MatButtonHarness} from '@angular/material/button/testing';

export class LobbyComponentHarness extends ComponentHarness {
  static hostSelector = 'app-lobby';

  private readonly players = this.locatorForAll(MatListItemHarness);
  readonly startButton = this.locatorForOptional(MatButtonHarness.with({text: 'Start Game'}));
  readonly joinButton = this.locatorForOptional(MatButtonHarness.with({text: 'Join Game'}));

  async getPlayers(): Promise<string[]> {
    const players = await this.players();
    return Promise.all(players.map(async (player) => await player.getText()));
  }
}
