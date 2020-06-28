import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {ReplaySubject} from 'rxjs';
import {Game, GameId, GameState} from '../../../../game/models/models';
import {GameService} from '../game/game.service';
import {ActivatedRoute, Router} from '@angular/router';
import {takeUntil} from 'rxjs/operators';
import {initial, isError, loading, StatusAnd} from '../common/status_and';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ErrorService} from '../common/error.service';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LobbyComponent implements OnInit {

  startGameStatus: StatusAnd<void> = initial();
  game = new ReplaySubject<Game>();
  private readonly gameId: GameId;

  /** Handle on-destroy Subject, used to unsubscribe. */
  private readonly destroyed = new ReplaySubject<void>(1);

  constructor(private readonly gameService: GameService,
              private readonly matSnackBar: MatSnackBar,
              private readonly router: Router,
              private readonly errorService: ErrorService,
              route: ActivatedRoute) {
    this.gameId = route.snapshot.paramMap.get('game_id');
    this.game.pipe(takeUntil(this.destroyed)).subscribe((val) => {
      if (val?.state === GameState.IN_PROGRESS) {
        this.router.navigateByUrl(`gameon/${this.gameId}`);
      }
    });
    this.gameService.subscribeToGame(this.gameId, this.game);
  }

  ngOnInit(): void {
  }

  startGame() {
    this.startGameStatus = loading();
    this.gameService.startGame(this.gameId).pipe(takeUntil(this.destroyed)).subscribe((val) => {
      this.startGameStatus = val;
      if (isError(val)) {
        this.errorService.displayError('Error starting game', val.error);
      }
    })
  }

  ngOnDestroy() {
    // Unsubscribes all pending subscriptions.
    this.destroyed.next();
    this.destroyed.complete();
  }

}
