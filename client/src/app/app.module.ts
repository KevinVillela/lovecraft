import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {MainMenuModule} from './main-menu/main-menu.module';
import {GameFacade} from '../../../game/facade/facade';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FirestoreGameStore} from './game/firestore-game-store';
import {AngularFireDatabaseModule} from '@angular/fire/database';
import {AngularFireModule} from '@angular/fire';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import {LobbyModule} from './lobby/lobby.module';
import {PlayModule} from './play/play.module';
import {CommonServicesModule} from './common/common.module';
import {MatTooltipModule} from '@angular/material/tooltip';


// The web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDSEjHXgjFEJgoP0rRyo5CZTjGCIgPFZYs',
  authDomain: 'lovecraft-d1f18.firebaseapp.com',
  databaseURL: 'https://lovecraft-d1f18.firebaseio.com',
  projectId: 'lovecraft-d1f18',
  storageBucket: 'lovecraft-d1f18.appspot.com',
  messagingSenderId: '318537018451',
  appId: '1:318537018451:web:249518ca14ed6b84192aa6',
  measurementId: 'G-T97GZSP0NS'
};

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    MainMenuModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    LobbyModule,
    PlayModule,
    CommonServicesModule,
    MatTooltipModule,
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
