import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-recruiter-area-placeholder',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="app-page">
      <mat-card class="recruiter-placeholder" appearance="outlined">
        <mat-card-content>
          <mat-icon class="recruiter-placeholder__icon">construction</mat-icon>
          <h1 class="recruiter-placeholder__title">Filtrar currículos</h1>
          <p class="recruiter-placeholder__message">
            Esta área está em construção e será disponibilizada em breve.
          </p>
          <button mat-flat-button color="primary" routerLink="/">
            Voltar ao cadastro de currículo
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .recruiter-placeholder {
        width: 100%;
        max-width: var(--app-page-max-width);
        text-align: center;
        padding: var(--app-space-4);
      }
      .recruiter-placeholder__icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--mat-sys-on-surface-variant);
      }
      .recruiter-placeholder__title {
        font: var(--mat-sys-headline-small);
        margin: var(--app-space-3) 0 var(--app-space-2);
      }
      .recruiter-placeholder__message {
        font: var(--mat-sys-body-medium);
        color: var(--mat-sys-on-surface-variant);
        margin: 0 0 var(--app-space-4);
      }
    `,
  ],
})
export class RecruiterAreaPlaceholder {}
