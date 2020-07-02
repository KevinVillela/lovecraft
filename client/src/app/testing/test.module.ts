import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InMemoryGameStore} from '../../../../game/facade/in_memory_game_store';
import {GameFacade} from '../../../../game/facade/facade';
import {AngularFireAuth} from '@angular/fire/auth';
import {BehaviorSubject} from 'rxjs';
import {RouterTestingModule} from '@angular/router/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

class FakeAngularFireAuth {
  user = new BehaviorSubject({displayName: 'villela@google.com'});
}

/**
 * A module to be used only for testing, which provides a default environment and dependencies for
 * tests to run in.
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterTestingModule,
    NoopAnimationsModule
  ],
  providers: [{provide: GameFacade, useFactory: () => new GameFacade(new InMemoryGameStore())},
    {provide: AngularFireAuth, useClass: FakeAngularFireAuth}
  ],
})
export class TestModule {
}
