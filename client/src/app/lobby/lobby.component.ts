import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs';
import {Game, GameId, GameState, Player} from '../../../../game/models/models';
import {GameService} from '../game/game.service';
import {ActivatedRoute, Router} from '@angular/router';
import {map, takeUntil} from 'rxjs/operators';
import {initial, isError, loading, StatusAnd} from '../common/status_and';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ErrorService} from '../common/error.service';
import {SUPPORTED_SPECIAL_CARDS} from '../../../../game/reducers/game_reducers';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LobbyComponent implements OnInit {

  startGameStatus: StatusAnd<void> = initial();
  game = new BehaviorSubject<Game | null>(null);
  private readonly gameId: GameId;

  /** Handle on-destroy Subject, used to unsubscribe. */
  private readonly destroyed = new ReplaySubject<void>(1);
  /** Returns true iff the current player is in the current game. */
  readonly inGame: Observable<boolean>;

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
    this.inGame = this.game.pipe(map((val) => {
      return !!val?.playerList?.find((player) => player.id === this.gameService.username);
    }));
    this.gameService.subscribeToGame(this.gameId, this.game);
  }

  ngOnInit(): void {
  }

  startGame(): void {
    this.startGameStatus = loading();
    this.gameService.startGame(this.gameId).pipe(takeUntil(this.destroyed)).subscribe((val) => {
      this.startGameStatus = val;
      if (isError(val)) {
        this.errorService.displayError('Error starting game', val.error);
      }
    });
  }

  joinGame(): void {
    this.gameService.joinGame(this.gameId).pipe(takeUntil(this.destroyed)).subscribe((val) => {
      if (isError(val)) {
        this.errorService.displayError('Error joining game', val.error);
      }
    });
  }

  updateSpecialCards(checked: boolean): void {
    const currentOptions = {...this.game.value?.options};
    currentOptions.specialCardCount = checked ? SUPPORTED_SPECIAL_CARDS.length : 0;
    this.gameService.updateGameOptions(this.gameId, currentOptions).pipe(takeUntil(this.destroyed)).subscribe((val) => {
      if (isError(val)) {
        this.errorService.displayError('Error updating number of special cards', val.error);
      }
    });
  }

  updateCthulhus(checked: boolean): void {
    const currentOptions = {...this.game.value?.options};
    currentOptions.cthulhuCount = checked ? 2 : 1;
    this.gameService.updateGameOptions(this.gameId, currentOptions).pipe(takeUntil(this.destroyed)).subscribe((val) => {
      if (isError(val)) {
        this.errorService.displayError('Error updating number of Cthulhus', val.error);
      }
    });
  }

  ngOnDestroy() {
    // Unsubscribes all pending subscriptions.
    this.destroyed.next();
    this.destroyed.complete();
  }

}
