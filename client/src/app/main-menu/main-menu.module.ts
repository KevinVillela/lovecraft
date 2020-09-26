import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MainMenuComponent} from './main-menu.component';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatButtonModule} from '@angular/material/button';
import {MatListModule} from '@angular/material/list';
import {MatOptionModule} from '@angular/material/core';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';
import { OrderByDatePipe } from './order-by-date.pipe';
import {RouterModule} from '@angular/router';


@NgModule({
  declarations: [MainMenuComponent, OrderByDatePipe],
  exports: [MainMenuComponent],
  imports: [
    CommonModule, MatSnackBarModule, MatButtonModule, MatListModule, MatOptionModule, MatInputModule, MatFormFieldModule, FormsModule, RouterModule
  ],
})
export class MainMenuModule {
}
