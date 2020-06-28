import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PlayComponent} from './play.component';
import {FormsModule} from '@angular/forms';
import {MatTooltipModule} from '@angular/material/tooltip';


@NgModule({
  declarations: [PlayComponent],
  imports: [
    CommonModule, FormsModule, MatTooltipModule
  ],
  exports: [PlayComponent]
})
export class PlayModule {
}
