import {Pipe, PipeTransform} from '@angular/core';
import {Game} from '../../../../game/models/models';

@Pipe({
  name: 'orderByDate'
})
export class OrderByDatePipe implements PipeTransform {

  transform(value: { value: Game }[]): unknown {
    return value.sort((a, b) =>
        b.value.created.getTime() - a.value.created.getTime()
    );
  }

}
