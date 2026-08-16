import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/registration-form/registration-form').then((m) => m.RegistrationForm),
  },
  {
    path: 'recrutador',
    loadComponent: () =>
      import('./features/recruiter-search/recruiter-search').then((m) => m.RecruiterSearch),
  },
  { path: '**', redirectTo: '' },
];
