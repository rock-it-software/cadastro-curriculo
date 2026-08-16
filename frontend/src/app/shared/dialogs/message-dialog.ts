import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface MessageDialogData {
  message: string;
  tone: 'success' | 'error';
}

@Component({
  selector: 'app-message-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.tone === 'success' ? 'Sucesso' : 'Atenção' }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" (click)="dialogRef.close()">OK</button>
    </mat-dialog-actions>
  `,
})
export class MessageDialog {
  readonly dialogRef = inject(MatDialogRef<MessageDialog>);
  readonly data = inject<MessageDialogData>(MAT_DIALOG_DATA);
}
