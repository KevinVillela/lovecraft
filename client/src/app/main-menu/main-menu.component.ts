import {Component, OnInit} from '@angular/core';
import {GameService} from '../game/game.service';
import {initial, isError, isReady, loading, StatusAnd} from '../common/status_and';
import {Game} from '../../../../game/models/models';
import {ReplaySubject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {ErrorService} from '../common/error.service';
import {AngularFireAuth} from '@angular/fire/auth';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit {

  joinGameStatus: StatusAnd<void> = initial();
  createGameStatus: StatusAnd<void> = initial();
  allGames: Record<string, Game> = {};

  /** Handle on-destroy Subject, used to unsubscribe. */
  private readonly destroyed = new ReplaySubject<void>(1);

  constructor(private readonly gameService: GameService,
              private readonly matSnackBar: MatSnackBar,
              private readonly router: Router,
              private readonly auth: AngularFireAuth,
              private readonly errorService: ErrorService) {
  }

  ngOnInit(): void {
    this.gameService.listGamesStream().pipe(takeUntil(this.destroyed)).subscribe((val) => {
      if (isReady(val)) {
        this.allGames = val.result;
      } else if (isError(val)) {
        this.errorService.displayError('Error listing games', val.error);
      }
    });
  }

  joinGame(gameId: string) {
    if (this.allGames[gameId].playerList.find((player) => player.id === this.gameService.username)) {
      this.router.navigateByUrl(`lobby/${gameId}`);
      return;
    }
    this.joinGameStatus = loading();
    this.gameService.joinGame(gameId).pipe(takeUntil(this.destroyed)).subscribe((val) => {
      this.joinGameStatus = val;
      if (isError(val)) {
        this.errorService.displayError('Error joining game', val.error);
      } else if (isReady(val)) {
        this.router.navigateByUrl(`lobby/${gameId}`);
      }
    });
  }

  createGame() {
    this.createGameStatus = loading();
    const randomishId = Math.random().toString(36).substring(2, 6);
    this.gameService.createGame(randomishId).pipe(takeUntil(this.destroyed)).subscribe((val) => {
      this.createGameStatus = val;
      if (isError(val)) {
        this.errorService.displayError('Error creating game', val.error);
      } else if (isReady(val)) {
        this.router.navigateByUrl(`lobby/${randomishId}`);
      }
    });
  }

  ngOnDestroy() {
    // Unsubscribes all pending subscriptions.
    this.destroyed.next();
    this.destroyed.complete();
  }
}
