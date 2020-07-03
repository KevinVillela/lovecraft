import {ComponentHarness} from '@angular/cdk/testing';
import {MatListOptionHarness} from '@angular/material/list/testing';

export class MainMenuComponentHarness extends ComponentHarness {
  static hostSelector = 'app-main-menu';

  private readonly options = this.locatorForAll(MatListOptionHarness);

  async getGames(): Promise<{ title: string, subTitle: string }[]> {
    const options = await this.options();
    const games = [];
    for (const option of options) {
      const lines = await option.getLinesText();
      games.push({
        title: lines[0],
        subTitle: lines[1]
      });
    }
    return games;
  }
}
