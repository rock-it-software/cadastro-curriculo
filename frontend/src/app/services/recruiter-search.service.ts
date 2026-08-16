import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PaginatedRegistrations,
  RegistrationsSearchFilter,
} from '../models/candidate-summary.model';

@Injectable({ providedIn: 'root' })
export class RecruiterSearchService {
  private readonly http = inject(HttpClient);

  search(filter: RegistrationsSearchFilter): Observable<PaginatedRegistrations> {
    let params = new HttpParams().set('jobRole', filter.jobRole);
    if (filter.city) {
      params = params.set('city', filter.city);
    }
    if (filter.uf) {
      params = params.set('uf', filter.uf);
    }
    if (filter.page) {
      params = params.set('page', filter.page);
    }
    if (filter.pageSize) {
      params = params.set('pageSize', filter.pageSize);
    }

    return this.http.get<PaginatedRegistrations>('/api/registrations', { params });
  }

  downloadCv(id: string): Observable<void> {
    return new Observable<void>((subscriber) => {
      this.http
        .get(`/api/registrations/${id}/cv`, { observe: 'response', responseType: 'blob' })
        .subscribe({
          next: (response) => {
            const blob = response.body;
            if (!blob) {
              subscriber.error(new Error('Resposta de download vazia.'));
              return;
            }
            const fileName = this.extractFileName(response.headers.get('Content-Disposition')) ?? 'curriculo';
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = fileName;
            anchor.click();
            URL.revokeObjectURL(url);
            subscriber.next();
            subscriber.complete();
          },
          error: (err) => subscriber.error(err),
        });
    });
  }

  private extractFileName(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;
    const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
    if (utf8Match) {
      return decodeURIComponent(utf8Match[1]);
    }
    const asciiMatch = /filename="?([^";]+)"?/.exec(contentDisposition);
    return asciiMatch ? asciiMatch[1] : null;
  }
}
