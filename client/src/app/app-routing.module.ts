import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MainMenuComponent} from './main-menu/main-menu.component';
import {LobbyComponent} from './lobby/lobby.component';
import {PlayComponent} from './play/play.component';


const routes: Routes = [
  {path: '', component: MainMenuComponent},
  {path: 'lobby/:game_id', component: LobbyComponent},
  {path: 'gameon/:game_id', component: PlayComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
