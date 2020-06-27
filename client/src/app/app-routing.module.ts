import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MainMenuComponent} from './main-menu/main-menu.component';


const routes: Routes = [
  {path: '', component: MainMenuComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
