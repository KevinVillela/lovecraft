import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

/** A simple service for display error messages in the application. */
@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(private readonly matSnackBar: MatSnackBar) {
  }

  displayErrorMessage(message: string): void {
    this.matSnackBar.open(message, 'OK', {duration: 5000});
  }

  displayError(prefix: string, error: any): void {
    let errorString = JSON.stringify(error);
    if (error.message) {
      errorString = error.message;
    }
    this.displayErrorMessage(`${prefix}: ${errorString}`);
  }
}
