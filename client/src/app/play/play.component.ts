import {Component, OnInit} from '@angular/core';
import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {Card, Game, GameId, Player, Role} from '../../../../game/models/models';
import {GameService} from '../game/game.service';
import {initial, isError, loading, StatusAnd} from '../common/status_and';
import {MatSnackBar} from '@angular/material/snack-bar';
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
  private readonly gameId: GameId;

  /** Handle on-destroy Subject, used to unsubscribe. */
  private readonly destroyed = new ReplaySubject<void>(1);

  readonly players: Observable<CirclePlayer[]>;
  readonly cardRounds: Observable<Card[][]>;
  private username = '';

  constructor(private readonly gameService: GameService,
              private readonly matSnackBar: MatSnackBar,
              private readonly router: Router,
              private readonly errorService: ErrorService,
              route: ActivatedRoute,
              private readonly auth: AngularFireAuth) {
    this.auth.user.subscribe(value => {
      this.username = value.displayName || '';
    });
    this.gameId = route.snapshot.paramMap.get('game_id');
    this.gameService.subscribeToGame(this.gameId, this.game);
    this.players = this.game.pipe(takeUntil(this.destroyed),
        map(game => ellipse(game?.playerList || [], 400, 250, 5)));
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

  investigate(target: Player, cardIndex: number) {
    this.investigateStatus = loading();
    this.gameService.investigate(this.gameId, target, cardIndex).pipe(takeUntil(this.destroyed)).subscribe((val) => {
      this.investigateStatus = val;
      if (isError(val)) {
        this.errorService.displayError('Error investigating', val.error);
      }
    })
  }

  tooltipForRole(role: Role) {
    switch (role) {
      case Role.NOT_SET:
        return '?';
      case Role.CULTIST:
        return 'You are a filthy cultist.';
      case Role.INVESTIGATOR:
        return 'You are a boring investigator.'
    }
  }

  imageForRole(role: Role) {
    switch (role) {
      case Role.NOT_SET:
        return '';
      case Role.CULTIST:
        return 'https://i.pinimg.com/originals/73/12/5a/73125a16d69a5d4c2af41036ba160a0a.png';
      case Role.INVESTIGATOR:
        return 'https://w0.pngwave.com/png/592/648/due-diligence-computer-icons-private-investigator-inspector-png-clip-art.png'
    }
  }

  tooltipForCard(card: Card) {
    switch (card) {
      case Card.FUTILE_INVESTIGATION:
        return 'A rock.';
      case Card.ELDER_SIGN:
        return 'An Elder sign! Go good guys!';
      case Card.CTHULHU:
        return 'Oh no, a Cthulhu!';
      case Card.INSANITYS_GRASP:
        return 'Insanity\'s grasp - no talking!';
    }
  }

  imageForCard(player: Player, card: Card) {
    if (player.id !== this.username) {
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Question_mark_%28black%29.svg/1200px-Question_mark_%28black%29.svg.png';
    }
    return this.imageForVisibleCard(card);
  }

  imageForVisibleCard(card: Card) {
    switch (card) {
      case Card.FUTILE_INVESTIGATION:
        return 'https://i.redd.it/brxxveprs2e01.png';
      case Card.ELDER_SIGN:
        return 'https://images-na.ssl-images-amazon.com/images/I/61kdUERFxsL._AC_SL1500_.jpg';
      case Card.CTHULHU:
        return 'https://image.flaticon.com/icons/svg/1137/1137046.svg';
      case Card.INSANITYS_GRASP:
        return 'https://www.theglobeandmail.com/resizer/oIPwhVmLkTDNZPvo0V3VrL0dHzo=/4820x0/filters:quality(80)/arc-anglerfish-tgam-prod-tgam.s3.amazonaws.com/public/LDMBR7HMIZBY5ID2IRPIPETAYA.jpg';
    }
  }

  trackByIndex(index: number) {
    return index;
  }

  ngOnDestroy() {
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
    }
  });
}

