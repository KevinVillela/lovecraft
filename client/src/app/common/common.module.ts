import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {ErrorService} from './error.service';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
      MatSnackBarModule
  ],
  providers: [ErrorService]
})
export class CommonServicesModule { }
