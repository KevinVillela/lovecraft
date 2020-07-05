import {Component, OnInit} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, ReplaySubject} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {Card, Game, GameId, GameState, Player, PlayerId, Role} from '../../../../game/models/models';
import {GameService} from '../game/game.service';
import {initial, isError, loading, StatusAnd} from '../common/status_and';
import {map, takeUntil} from 'rxjs/operators';
import {ErrorService} from '../common/error.service';
import {AngularFireAuth} from '@angular/fire/auth';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss'],
  animations: [
    // the fade-in/fade-out animation.
    trigger('simpleFadeAnimation', [

      // the "in" style determines the "resting" state of the element when it is visible.
      state('in', style({opacity: 1})),

      // fade in when created. this could also be written as transition('void => *')
      transition(':enter', [
        style({opacity: 0}),
        animate(600)
      ]),

      // fade out when destroyed. this could also be written as transition('void => *')
      transition(':leave',
          animate(600, style({opacity: 0})))
    ])
  ]
})
export class PlayComponent implements OnInit {

  investigateStatus: StatusAnd<void> = initial();
  game = new BehaviorSubject<Game | null>(null);
  /** The card that is currently being viewed. */
  magnified: { player: PlayerId, cardIndex: number } | null = null;

  private readonly gameId: GameId;

  /** Handle on-destroy Subject, used to unsubscribe. */
  private readonly destroyed = new ReplaySubject<void>(1);

  readonly players: Observable<CirclePlayer[]>;
  readonly cardRounds: Observable<Card[][]>;
  /** The player that this client belongs to. */
  private currentPlayer?: Player;

  constructor(private readonly gameService: GameService,
              private readonly errorService: ErrorService,
              route: ActivatedRoute,
              private readonly auth: AngularFireAuth) {
    this.gameId = route.snapshot.paramMap.get('game_id');
    this.gameService.subscribeToGame(this.gameId, this.game);
    this.players = this.game.pipe(takeUntil(this.destroyed),
        map(game => ellipse(game?.playerList || [], 400, 250, 5)));
    combineLatest([this.players, this.auth.user]).pipe(takeUntil(this.destroyed)).subscribe(([players, user]) => {
      this.currentPlayer = players.find((player) => player.player.id === user.displayName)?.player;
    });
    this.cardRounds = this.game.pipe(map(value => {
      if (!value) {
        return [];
      }
      const numPlayers = value.playerList.length;
      const rounds = [];
      for (let i = 0; i < value.visibleCards.length; i += numPlayers) {
        rounds.push(value.visibleCards.slice(i, i + numPlayers));
      }
      return rounds;
    }));
  }

  ngOnInit(): void {
  }

  /** Magnifies or unmagnifies the given card. */
  magnifyCard(event: MouseEvent) {
    const target = (event.target as HTMLElement);
    if (target.classList.contains('magnified')) {
      target.classList.remove('magnified');
    } else {
      target.classList.add('magnified');
    }
  }

  clickCard(target: Player, cardIndex: number, event: MouseEvent): void {
    if (target.id === this.currentPlayer?.id) {
      this.magnifyCard(event);
      return;
    }
    this.investigateStatus = loading();
    this.gameService.investigate(this.gameId, target, cardIndex).pipe(takeUntil(this.destroyed)).subscribe((val) => {
      this.investigateStatus = val;
      if (isError(val)) {
        this.errorService.displayError('Error investigating', val.error);
      }
    });
  }

  /** Returns true if we can show the card to the current player. */
  shouldShowCard(player?: Player): boolean {
    return player?.id === this.currentPlayer?.id || this.game.value.state !== GameState.IN_PROGRESS;
  }

  private shouldShowRoleCard(player: Player): boolean {
    if (this.shouldShowCard(player)) {
      return true;
    }
    return !!this.currentPlayer?.secrets.find((secret) =>
        secret.player === player.id);

  }

  tooltipForRole(role: Role, player: Player): string {
    if (!this.shouldShowRoleCard(player)) {
      return 'The winning team. Maybe?';
    }
    switch (role) {
      case Role.NOT_SET:
        return '?';
      case Role.CULTIST:
        return 'A filthy cultist.';
      case Role.INVESTIGATOR:
        return 'A boring detective.';
    }
  }

  imageForRole(role: Role, player: Player): CardImage {
    if (!this.shouldShowRoleCard(player)) {
      return CardImage.BACK;
    }
    switch (role) {
      case Role.NOT_SET:
        return CardImage.BACK;
      case Role.CULTIST:
        return CardImage.CULTIST;
      case Role.INVESTIGATOR:
        return CardImage.INVESTIGATOR;
    }
  }

  tooltipForCard(card: Card, player?: Player): string {
    if (!this.shouldShowCard(player)) {
      return 'Unknown';
    }
    return this.tooltipForVisibleCard(card);
  }

  tooltipForVisibleCard(card: Card): string {
    switch (card) {
      case Card.PRIVATE_EYE:
        return 'Private Eye - Secretly reveal your role to the investigator.';
      case Card.EVIL_PRESENCE:
        return 'Evil Presence - Return all your unrevealed cards to the reshuffle pile.';
      case Card.MIRAGE:
        return 'Mirage - Return a previously discovered elder sign to the reshuffle pile.';
      case Card.PARANOIA:
        return 'Paranoia - Control the flashlight for the rest of the round.';
      case Card.PRESCIENT_VISION:
        return 'Prescient Vison - Reveal a card, flip it back over.';
      case Card.FUTILE_INVESTIGATION:
        return 'A rock.';
      case Card.ELDER_SIGN:
        return 'An Elder sign! Go good guys!';
      case Card.CTHULHU:
        return 'Oh no, a Cthulhu!';
      case Card.INSANITYS_GRASP:
        return 'Insanity\'s grasp - no talking!';
      default:
        return ((c: never) => CardImage.BACK)(card);
    }
  }

  imageForCard(player: Player, card: Card): string {
    if (!this.shouldShowCard(player)) {
      return CardImage.BACK;
    }
    return this.imageForVisibleCard(card);
  }

  imageForVisibleCard(card: Card): string {
    switch (card) {
      case Card.PRIVATE_EYE:
        return CardImage.PRIVATE_EYE;
      case Card.EVIL_PRESENCE:
        return CardImage.EVIL_PRESENCE;
      case Card.MIRAGE:
        return CardImage.MIRAGE;
      case Card.PARANOIA:
        return CardImage.PARANOIA;
      case Card.PRESCIENT_VISION:
        return CardImage.PRESCIENT_VISION;
      case Card.FUTILE_INVESTIGATION:
        return CardImage.ROCK;
      case Card.ELDER_SIGN:
        return CardImage.ELDER_SIGN;
      case Card.CTHULHU:
        return CardImage.CTHULHU;
      case Card.INSANITYS_GRASP:
        return CardImage.INSANITYS_GRASP;
      default:
        return ((c: never) => CardImage.BACK)(card);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  restart(): void {
    this.gameService.restartGame(this.game.value.id).pipe(takeUntil(this.destroyed)).subscribe((val) => {
      if (isError(val)) {
        this.errorService.displayError('Error restarting', val.error);
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribes all pending subscriptions.
    this.destroyed.next();
    this.destroyed.complete();
  }
}

interface CirclePlayer {
  player: Player;
  top: number;
  left: number;
}

/*
Taken from https://stackoverflow.com/questions/26599782/positioning-divs-in-a-circle-using-javascript.

where n = number of divs,
      rx = radius along X-axis,
      ry = radius along Y-axis,
*/
function ellipse(players: Player[], rx: number, ry: number, so: number): CirclePlayer[] {
  const n = players.length;
  return players.map((player, i) => {
    return {
      player,
      left: rx + rx * (Math.sin((360 / n / 180) * (i + so) * Math.PI)),
      top: ry + -ry * Math.cos((360 / n / 180) * (i + so) * Math.PI)
    };
  });
}

export enum CardImage {
  BACK = 'assets/back.png',
  CTHULHU = 'assets/cthulhu.png',
  CULTIST = 'assets/cultist.png',
  ELDER_SIGN = 'assets/elder_sign.png',
  EVIL_PRESENCE = 'assets/evil_presence.png',
  FLASHLIGHT = 'assets/flashlight.png',
  INSANITYS_GRASP = 'assets/insanitys_grasp.png',
  INVESTIGATOR = 'assets/investigator.png',
  MIRAGE = 'assets/mirage.png',
  PARANOIA = 'assets/paranoia.png',
  PRESCIENT_VISION = 'assets/prescient_vision.png',
  PRIVATE_EYE = 'assets/private_eye.png',
  ROCK = 'assets/rock.png'
}
