import {Injectable, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InMemoryGameStore} from '../../../../game/facade/in_memory_game_store';
import {GameFacade} from '../../../../game/facade/facade';
import {AngularFireAuth} from '@angular/fire/auth';
import {BehaviorSubject} from 'rxjs';
import {RouterTestingModule} from '@angular/router/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {PlayComponent} from '../play/play.component';
import {NoiseService} from '../app/play/noise.service';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30 * 1000;  // 30 seconds

class FakeAngularFireAuth {
  user = new BehaviorSubject({displayName: 'villela@google.com'});
}

@Injectable()
export class FakeNoiseService extends NoiseService {
  madeNoise = [];

  actuallyMakeNoise(source: string) {
    this.madeNoise.push(source);
  }

  clear() {
    this.madeNoise = [];
  }
}

/**
 * A module to be used only for testing, which provides a default environment and dependencies for
 * tests to run in.
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterTestingModule.withRoutes([{
      path: 'gameon/:game_id',
      component: PlayComponent
    },]),
    NoopAnimationsModule
  ],
  providers: [{
    provide: GameFacade,
    useFactory: () => new GameFacade(new InMemoryGameStore())
  },
    {provide: AngularFireAuth, useClass: FakeAngularFireAuth},
    {provide: NoiseService, useClass: FakeNoiseService},
  ],
})
export class TestModule {
}
