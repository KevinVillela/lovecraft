import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(private readonly matSnackBar: MatSnackBar) {
  }

  displayError(prefix: string, error: any): void {
    let errorString = JSON.stringify(error);
    if (error.message) {
      errorString = error.message;
    }
    this.matSnackBar.open(`${prefix}: ${errorString}`, 'OK', {duration: 5000});
  }
}
