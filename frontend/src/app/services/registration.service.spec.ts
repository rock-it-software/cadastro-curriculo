import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RegistrationService } from './registration.service';
import { RegistrationFormValue } from '../models/registration.model';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RegistrationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('POSTs a multipart body with every field and the file to /api/registrations', () => {
    const value: RegistrationFormValue = {
      fullName: 'Maria da Silva',
      birthDate: new Date(2020, 3, 15),
      email: 'maria@example.com',
      phone: '(11) 98765-4321',
      bairro: 'Pinheiros',
      city: 'São Paulo',
      stateUf: 'SP',
      desiredRoles: ['eletricista', 'motorista'],
    };
    const file = new File(['conteudo'], 'curriculo.pdf', { type: 'application/pdf' });

    let response: { id: string; createdAt: string } | undefined;
    service.create(value, file).subscribe((res) => (response = res));

    const req = httpMock.expectOne('/api/registrations');
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.get('fullName')).toBe('Maria da Silva');
    expect(body.get('birthDate')).toBe('2020-04-15');
    expect(body.get('email')).toBe('maria@example.com');
    expect(body.get('phone')).toBe('11987654321');
    expect(body.get('bairro')).toBe('Pinheiros');
    expect(body.get('city')).toBe('São Paulo');
    expect(body.get('stateUf')).toBe('SP');
    expect(body.getAll('desiredRoles')).toEqual(['eletricista', 'motorista']);
    expect((body.get('cvFile') as File).name).toBe('curriculo.pdf');

    req.flush({ id: 'abc-123', createdAt: '2026-08-15T00:00:00.000Z' });
    expect(response?.id).toBe('abc-123');
  });
});
