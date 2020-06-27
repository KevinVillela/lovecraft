import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {MainMenuModule} from './main-menu/main-menu.module';
import {GameFacade} from '../../../game/facade/facade';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

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
  providers: [{provide: GameFacade, useValue: new GameFacade()}],
  bootstrap: [AppComponent],
})
export class AppModule {
}
