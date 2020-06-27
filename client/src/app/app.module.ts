import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {MainMenuModule} from './main-menu/main-menu.module';
import {GameFacade} from '../../../game/facade/facade';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FirestoreGameStore} from './game/firestore-game-store.';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MainMenuModule,
    BrowserAnimationsModule
  ],
  providers: [{
    provide: GameFacade,
    useFactory: getGameFacade,
    deps: [FirestoreGameStore]
  }],
  bootstrap: [AppComponent],
})
export class AppModule {
}

export function getGameFacade(store: FirestoreGameStore) {
  return new GameFacade(store);
}
