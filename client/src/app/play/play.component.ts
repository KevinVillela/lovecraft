import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, ViewChild} from '@angular/core';
import {BehaviorSubject, combineLatest, concat, Observable, of, ReplaySubject, Subject} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {Card, Game, GameId, GameState, Player, PlayerId, Role} from '../../../../game/models/models';
import {GameService} from '../game/game.service';
import {initial, isError, loading, StatusAnd} from '../common/status_and';
import {delay, map, pairwise, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {ErrorService} from '../common/error.service';
import {AngularFireAuth} from '@angular/fire/auth';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {NoiseService} from '../app/play/noise.service';
import {PLAYER_SETUPS} from '../../../../game/reducers/game_reducers';

interface ResizeObserverOptions {
  box?: 'content-box' | 'border-box';
}

interface ResizeObserverSize {
  inlineSize: number;
  blockSize: number;
}

declare class ResizeObserver {
  constructor(callback: ResizeObserverCallback);

  disconnect(): void;

  observe(target: Element, options?: ResizeObserverOptions): void;

  unobserve(target: Element): void;
}

type ResizeObserverCallback = (entries: ReadonlyArray<ResizeObserverEntry>, observer: ResizeObserver) => void;

interface ResizeObserverEntry {
  readonly target: Element;
  readonly contentRect: DOMRectReadOnly;
  readonly borderBoxSize: ResizeObserverSize;
  readonly contentBoxSize: ResizeObserverSize;
}

/** Status of the current game in a form that is easier for the UI to consume. */
interface GameStatus {
  round: number;
  roundRemaining: number;
  minCultists: number;
  maxCultists: number;
  elderSignsPicked: number;
  elderSignsTotal: number;
  miragePicked: boolean;
}

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
        animate('600ms')
      ]),

      // fade out when destroyed. this could also be written as transition('void => *')
      transition(':leave',
          animate(600, style({opacity: 0})))
    ])
  ]
})
export class PlayComponent implements AfterViewInit {
  investigateStatus: StatusAnd<void> = initial();
  game = new BehaviorSubject<Game | null>(null);
  /** The card that is currently being viewed. */
  magnified: { player: PlayerId, cardIndex: number } | null = null;

  private readonly gameId: GameId;

  /** Handle on-destroy Subject, used to unsubscribe. */
  private readonly destroyed = new ReplaySubject<void>(1);

  players: Observable<CirclePlayer[]>;
  readonly cardRounds: Observable<Card[][]>;
  readonly gameStatus: Observable<GameStatus>;

  /** The player that this client belongs to. */
  private currentPlayer?: Player;
  /** The circle of players. */
  @ViewChild('circle') private playerCircle: ElementRef;
  /** Listens to resize events on the player circle. */
  private resizeObserver?: ResizeObserver;

  constructor(private readonly gameService: GameService,
              private readonly errorService: ErrorService,
              route: ActivatedRoute,
              private readonly auth: AngularFireAuth,
              private readonly noiseService: NoiseService,
              private readonly zone: NgZone,
              private readonly changeDetectorRef: ChangeDetectorRef) {
    this.gameId = route.snapshot.paramMap.get('game_id');
    this.noiseService.enable(this.gameId);
    const rawGame = new BehaviorSubject<Game | null>(null);
    this.gameService.subscribeToGame(this.gameId, rawGame);
    rawGame.pipe(takeUntil(this.destroyed),
        startWith(null),
        pairwise(),
        switchMap(([previousGame, currentGame]) => {
          if (previousGame?.currentInvestigatorId === currentGame?.currentInvestigatorId) {
            return of(currentGame);
          }
          return concat(of(onlyMoveFlashlight(previousGame, currentGame)), of(currentGame).pipe(delay(2000)));
        })
    ).subscribe(this.game);
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
    this.gameStatus = this.game.pipe(takeUntil(this.destroyed),
        map((game) => this.getGameStatus(game)))
  }

  ngAfterViewInit(): void {
    const onResize = new Subject<ResizeObserverEntry[]>();
    this.resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      this.zone.run(() => {
        onResize.next(entries);
      });
    });
    this.resizeObserver.observe(this.playerCircle.nativeElement);

    this.players = combineLatest([this.game,
      onResize.pipe(startWith([{contentRect: this.playerCircle.nativeElement.getBoundingClientRect()}]))
    ]).pipe(takeUntil(this.destroyed),
        tap((players) => {
          this.changeDetectorRef.detectChanges();
        }),
        map(([game, entries]) => {
          const size = entries[0].contentRect;
          return ellipse(game?.playerList || [], size.width / 2 - 100, size.height / 2 - 50, 0);
        }));
    combineLatest([this.players, this.auth.user]).pipe(takeUntil(this.destroyed)).subscribe(([players, user]) => {
      this.currentPlayer = players.find((player) => player.player.id === user.displayName)?.player;
    });
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

  getBradleyMessage(): string {
    const game = this.game.getValue();
    if (!game || (game.state !== GameState.CULTISTS_WON && game.state !== GameState.INVESTIGATORS_WON)) {
      return '';
    }
    const bradley = game.playerList.find((player) => player.id === 'Bradley Moore');
    if (!bradley) {
      return '';
    }
    const bradleysTeam = bradley.role;
    if (bradleysTeam === Role.CULTIST && game.state === GameState.CULTISTS_WON ||
        bradleysTeam === Role.INVESTIGATOR && game.state === GameState.INVESTIGATORS_WON) {
      return 'Bradley\'s team wins!!'
    } else {
      return 'Bradley\'s team loses :('
    }
  }

  /** Gets the current status of the game, in a way that the UI can comprehend it. */
  private getGameStatus(game: Game | null) {
    if (!game) {
      return null;
    }
    const numPlayers = game.playerList.length;
    const setup = PLAYER_SETUPS[numPlayers];
    const cardsPicked = game.visibleCards.length % numPlayers;
    const elderSignsPicked = game.visibleCards.filter(card => card === Card.ELDER_SIGN).length;
    return {
      round: game.round,
      roundRemaining: numPlayers - cardsPicked,
      elderSignsPicked,
      elderSignsTotal: setup.elderSigns,
      miragePicked: !!game.visibleCards.filter(card => card === Card.MIRAGE).length,
      minCultists: setup.cultists + setup.investigators !== numPlayers ? setup.cultists - 1 : setup.cultists,
      maxCultists: setup.cultists,
    };
  }

  /** Gets a user-readable string for how many cultists could be in the game. */
  getNumCultists() {
    const numPlayers = this.game?.value?.playerList?.length;
    const setup = PLAYER_SETUPS[numPlayers];
    if (!numPlayers || !setup) {
      return '';
    }

    if (setup.cultists + setup.investigators === numPlayers) {
      return setup.cultists;
    }

    return `${setup.cultists - 1} - ${setup.cultists}`;
  }


  ngOnDestroy(): void {
    // Unsubscribes all pending subscriptions.
    this.destroyed.next();
    this.destroyed.complete();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
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

/** Only moves the flashlight from the current game to the previous game. */
function onlyMoveFlashlight(previousGame: Game | null, currentGame: Game | null): Game {
  if (previousGame === null) {
    return null;
  }
  if (currentGame === null) {
    return previousGame;
  }
  return {
    ...previousGame,
    currentInvestigatorId: currentGame.currentInvestigatorId,
  };
}

