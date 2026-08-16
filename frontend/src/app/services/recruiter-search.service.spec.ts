import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RecruiterSearchService } from './recruiter-search.service';
import { PaginatedRegistrations } from '../models/candidate-summary.model';

describe('RecruiterSearchService', () => {
  let service: RecruiterSearchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecruiterSearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends only jobRole when city, uf, page, and pageSize are absent', () => {
    let response: PaginatedRegistrations | undefined;
    service.search({ jobRole: 'eletricista' }).subscribe((res) => (response = res));

    const req = httpMock.expectOne(
      (r) => r.url === '/api/registrations' && r.method === 'GET',
    );
    expect(req.request.params.keys()).toEqual(['jobRole']);
    expect(req.request.params.get('jobRole')).toBe('eletricista');

    const body: PaginatedRegistrations = { items: [], total: 0, page: 1, pageSize: 20 };
    req.flush(body);
    expect(response?.total).toBe(0);
  });

  it('sends city, uf, page, and pageSize when provided', () => {
    service
      .search({ jobRole: 'motorista', city: 'Campinas', uf: 'SP', page: 2, pageSize: 50 })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/registrations');
    expect(req.request.params.get('jobRole')).toBe('motorista');
    expect(req.request.params.get('city')).toBe('Campinas');
    expect(req.request.params.get('uf')).toBe('SP');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('50');

    req.flush({ items: [], total: 0, page: 2, pageSize: 50 });
  });
});
