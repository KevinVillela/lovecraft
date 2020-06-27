import {Component, OnInit} from '@angular/core';
import {GameService} from '../game/game.service';
import {initial, isError, isReady, loading, StatusAnd} from '../common/status_and';
import {GameId} from '../../../../game/models/models';
import {ReplaySubject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit {

  createGameStatus: StatusAnd<GameId> = initial();
  allGames: GameId[] = [];

  /** Handle on-destroy Subject, used to unsubscribe. */
  private readonly destroyed = new ReplaySubject<void>(1);

  constructor(private readonly gameService: GameService,
              private readonly matSnackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.gameService.listGamesStream().pipe(takeUntil(this.destroyed)).subscribe((val) => {
      if (isReady(val)) {
        this.allGames = val.result;
      } else if (isError(val)) {
        this.matSnackBar.open(`Error listing games: ${JSON.stringify(val.error)}`);
      }
    });
  }

  createGame() {
    this.createGameStatus = loading();
    const randomishId = Math.random().toString(36).substring(2, 6);
    this.gameService.createGame(randomishId).pipe(takeUntil(this.destroyed)).subscribe((val) => {
      this.createGameStatus = val;
      if (isError(val)) {
        this.matSnackBar.open(`Error creating game: ${JSON.stringify(val.error)}`);
      }
    });
  }

  ngOnDestroy() {
    // Unsubscribes all pending subscriptions.
    this.destroyed.next();
    this.destroyed.complete();
  }
}
