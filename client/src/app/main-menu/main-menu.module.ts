import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MainMenuComponent} from './main-menu.component';
import {MatSnackBarModule} from '@angular/material/snack-bar';


@NgModule({
  declarations: [MainMenuComponent],
  exports: [MainMenuComponent],
  imports: [
    CommonModule, MatSnackBarModule
  ]
})
export class MainMenuModule {
}
