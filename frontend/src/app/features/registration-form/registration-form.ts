import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';

import { RegistrationService } from '../../services/registration.service';
import { MessageDialog } from '../../shared/dialogs/message-dialog';
import { BRAZILIAN_STATES } from '../../shared/constants/uf.constant';
import {
  atLeastOneCheckedValidator,
  brazilianPhoneValidator,
  notFutureDateValidator,
} from '../../shared/validators/br-validators';
import {
  ACCEPTED_CV_EXTENSIONS,
  ACCEPTED_CV_MIME_TYPES,
  ApiErrorResponse,
  JOB_ROLE_OPTIONS,
  MAX_CV_FILE_SIZE_BYTES,
  RegistrationFormValue,
} from '../../models/registration.model';

@Component({
  selector: 'app-registration-form',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './registration-form.html',
  styleUrl: './registration-form.scss',
})
export class RegistrationForm {
  private readonly fb = inject(FormBuilder);
  private readonly registrationService = inject(RegistrationService);
  private readonly dialog = inject(MatDialog);

  readonly jobRoleOptions = JOB_ROLE_OPTIONS;
  readonly ufOptions = BRAZILIAN_STATES;
  readonly maxBirthDate = new Date();
  readonly acceptAttribute = ACCEPTED_CV_EXTENSIONS.join(',');

  cvFile: File | null = null;
  fileError: string | null = null;
  submitting = false;

  readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    birthDate: this.fb.control<Date | null>(null, [Validators.required, notFutureDateValidator()]),
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, brazilianPhoneValidator()]],
    bairro: ['', [Validators.required, Validators.maxLength(100)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    stateUf: ['', [Validators.required]],
    desiredRoles: this.fb.control<string[]>([], [atLeastOneCheckedValidator()]),
  });

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (file.size <= 0 || file.size > MAX_CV_FILE_SIZE_BYTES) {
      this.fileError = 'O arquivo deve ter no máximo 4MB.';
      return;
    }

    const extension = this.extractExtension(file.name);
    const extensionOk = ACCEPTED_CV_EXTENSIONS.includes(extension);
    const mimeOk = ACCEPTED_CV_MIME_TYPES.includes(file.type);
    if (!extensionOk || !mimeOk) {
      this.fileError = 'Envie um arquivo nos formatos Word ou PDF.';
      return;
    }

    this.fileError = null;
    this.cvFile = file;
  }

  removeFile(): void {
    this.cvFile = null;
    this.fileError = null;
  }

  toggleRole(value: string, checked: boolean): void {
    const current = this.form.controls.desiredRoles.value ?? [];
    const next = checked ? [...current, value] : current.filter((role) => role !== value);
    this.form.controls.desiredRoles.setValue(next);
    this.form.controls.desiredRoles.markAsTouched();
  }

  isRoleChecked(value: string): boolean {
    return (this.form.controls.desiredRoles.value ?? []).includes(value);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || !this.cvFile) {
      this.showDialog('Preencha todos os campos', 'error');
      return;
    }

    this.submitting = true;
    const raw = this.form.getRawValue();
    const value: RegistrationFormValue = {
      fullName: raw.fullName ?? '',
      birthDate: raw.birthDate ?? null,
      email: raw.email ?? '',
      phone: raw.phone ?? '',
      bairro: raw.bairro ?? '',
      city: raw.city ?? '',
      stateUf: raw.stateUf ?? '',
      desiredRoles: raw.desiredRoles ?? [],
    };
    this.registrationService.create(value, this.cvFile).subscribe({
      next: () => {
        this.submitting = false;
        this.showDialog('Salvo com sucesso', 'success');
        this.resetForm();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        const body = err.error as ApiErrorResponse | undefined;
        this.showDialog(body?.message ?? 'Não foi possível salvar. Tente novamente.', 'error');
      },
    });
  }

  onClear(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.form.reset({
      fullName: '',
      birthDate: null,
      email: '',
      phone: '',
      bairro: '',
      city: '',
      stateUf: '',
      desiredRoles: [],
    });
    this.cvFile = null;
    this.fileError = null;
  }

  private showDialog(message: string, tone: 'success' | 'error'): void {
    this.dialog.open(MessageDialog, { data: { message, tone } });
  }

  private extractExtension(fileName: string): string {
    const match = /\.[^.]+$/.exec(fileName.toLowerCase());
    return match ? match[0] : '';
  }
}
