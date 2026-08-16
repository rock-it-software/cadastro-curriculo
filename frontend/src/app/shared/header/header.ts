import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatToolbarModule, MatButtonModule],
  template: `
    <mat-toolbar color="primary" class="app-header">
      <span class="app-header__title">Cadastro de Currículo</span>
      <span class="app-header__spacer"></span>
      <button mat-stroked-button routerLink="/recrutador">Área do Recrutador</button>
    </mat-toolbar>
  `,
  styles: [
    `
      .app-header {
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .app-header__title {
        font: var(--mat-sys-title-medium);
      }
      .app-header__spacer {
        flex: 1 1 auto;
      }
    `,
  ],
})
export class Header {}
