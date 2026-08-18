import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  RegistrationCreatedResponse,
  RegistrationFormValue,
} from '../models/registration.model';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly http = inject(HttpClient);

  create(value: RegistrationFormValue, cvFile: File): Observable<RegistrationCreatedResponse> {
    const formData = new FormData();
    formData.append('fullName', value.fullName);
    formData.append('birthDate', this.toIsoDate(value.birthDate));
    formData.append('email', value.email);
    formData.append('phone', value.phone.replace(/\D/g, ''));
    formData.append('bairro', value.bairro);
    formData.append('city', value.city);
    formData.append('stateUf', value.stateUf);
    for (const role of value.desiredRoles) {
      formData.append('desiredRoles', role);
    }
    formData.append('cvFile', cvFile, cvFile.name);

    return this.http.post<RegistrationCreatedResponse>('/api/registrations', formData);
  }

  private toIsoDate(date: Date | null): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
