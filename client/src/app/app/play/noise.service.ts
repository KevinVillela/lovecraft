import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Card, Game, GameId, GameState} from '../../../../../game/models/models';
import {GameService} from '../../game/game.service';
import {delay, distinctUntilChanged, filter, map} from 'rxjs/operators';

/**
 * This service listens to the current Game and makes noise based on events.
 */
@Injectable({
  providedIn: 'root'
})
export class NoiseService {
  private enabled = false;

  constructor(private readonly gameService: GameService) {
  }

  enable(gameId: GameId) {
    this.enabled = true;
    const gameObserver = new BehaviorSubject<Game | undefined>(undefined);
    this.gameService.subscribeToGame(gameId, gameObserver);

    // Listen for when the current investigator changes.
    gameObserver.pipe(filter(game => !!game), map(game => game?.currentInvestigatorId),
        distinctUntilChanged()).subscribe((currentInvestigatorId) => {
      this.makeNoise('suspense');
    });

    // Listen for when the current investigator changes, but with a delay.
    gameObserver.pipe(filter(game => !!game), map(game => game?.currentInvestigatorId),
        distinctUntilChanged(), delay(3000)).subscribe((currentInvestigatorId) => {
      if (currentInvestigatorId === this.gameService.username && (gameObserver.value?.state === GameState.IN_PROGRESS)) {
        this.makeNoise('your_turn');
      }
    });

    // Listen for when the picked cards changes.
    gameObserver.pipe(filter(game => !!game), map(game => game?.visibleCards),
        distinctUntilChanged(),
        // Delay to match up with the card being revealed.
        delay(2000)).subscribe((cards) => {
      if (!cards?.length) {
        return;
      }
      if (gameObserver.value?.state === GameState.CULTISTS_WON) {
        this.makeNoise(GameState.CULTISTS_WON);
        return;
      }
      if (gameObserver.value?.state === GameState.INVESTIGATORS_WON) {
        this.makeNoise(GameState.INVESTIGATORS_WON);
        return;
      }
      const mostRecentCard = cards[cards.length - 1];
      this.makeNoise(mostRecentCard);
    });
  }

  disable() {
    this.enabled = false;
  }

  private makeNoise(noise: SoundType) {
    if (!this.enabled) {
      return;
    }
    this.actuallyMakeNoise(getSource(noise));
  }

  /** A function, visible only for testing, that can be mocked out in tests. */
  actuallyMakeNoise(source: string) {
    let audio = new Audio();
    audio.src = source;
    audio.load();
    audio.play();
  }

}

type SoundType =
    'your_turn'
    | 'suspense'
    | Card
    | GameState.CULTISTS_WON
    | GameState.INVESTIGATORS_WON;

function getSource(noise: SoundType) {
  if (noise === 'your_turn') {
    return SOUNDS.YOUR_TURN;
  }
  if (noise === 'suspense') {
    return SOUNDS.HEARTBEAT;
  }

  if (noise === GameState.CULTISTS_WON) {
    return SOUNDS.CULTISTS_WIN;
  }
  if (noise === GameState.INVESTIGATORS_WON) {
    return SOUNDS.INVESTIGATORS_WIN;
  }

  switch (noise) {
    case Card.FUTILE_INVESTIGATION:
      return SOUNDS.ROCK;
    case Card.ELDER_SIGN:
      return SOUNDS.SUCCESS;
    case Card.CTHULHU:
      return SOUNDS.LAUGH;
    case Card.PRIVATE_EYE:
      return SOUNDS.HMM;
    case Card.INSANITYS_GRASP:
    case Card.EVIL_PRESENCE:
    case Card.MIRAGE:
    case Card.PARANOIA:
    case Card.PRESCIENT_VISION:
      return SOUNDS.SPECIAL;
    default:
      return ((assertUnreachable: never) => '')(noise);
  }
}

export enum SOUNDS {
  YOUR_TURN = 'assets/your_turn.mp3',
  HEARTBEAT = 'assets/heartbeat.mp3',
  CULTISTS_WIN = 'assets/cultists_win.mp3',
  INVESTIGATORS_WIN = 'assets/investigators_win.mp3',
  ROCK = 'assets/rock.mp3',
  SUCCESS = 'assets/success.mp3',
  LAUGH = 'assets/laugh.mp3',
  HMM = 'assets/hmm.mp3',
  SPECIAL = 'assets/special.mp3'
};
