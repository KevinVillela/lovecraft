import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PlayComponent} from './play.component';
import {FormsModule} from '@angular/forms';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatButtonModule} from '@angular/material/button';


@NgModule({
  declarations: [PlayComponent],
  imports: [
    CommonModule, FormsModule, MatTooltipModule, MatButtonModule
  ],
  exports: [PlayComponent]
})
export class PlayModule {
}
