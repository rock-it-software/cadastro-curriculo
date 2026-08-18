import {
  ACCEPTED_CV_EXTENSIONS,
  ACCEPTED_CV_MIME_TYPES,
  BRAZILIAN_STATES,
  JOB_ROLES,
  MAX_CV_FILE_SIZE_BYTES,
  RegistrationInput,
  StateUf,
  UploadedCvFile,
  ValidationResult,
} from '../types/registration';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidFullName(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

export function isValidBirthDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealCalendarDate =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isRealCalendarDate) return false;

  // Compare as ISO date strings (both derived the same way) so the check is
  // independent of the server's local timezone.
  const todayIso = new Date().toISOString().slice(0, 10);
  return value <= todayIso;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidPhone(value: string): boolean {
  const digits = normalizePhone(value);
  if (digits.length !== 10 && digits.length !== 11) return false;
  if (digits.length === 11 && digits[2] !== '9') return false;
  return true;
}

export function isValidBairro(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

export function isValidCity(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

export function isValidStateUf(value: string): value is StateUf {
  return (BRAZILIAN_STATES as readonly string[]).includes(value.toUpperCase());
}

export function isValidDesiredRoles(value: string[]): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every((role) => (JOB_ROLES as readonly string[]).includes(role));
}

export function validateRegistrationFields(input: RegistrationInput): ValidationResult {
  const invalidFields: string[] = [];

  if (!isValidFullName(input.fullName)) invalidFields.push('fullName');
  if (!isValidBirthDate(input.birthDate)) invalidFields.push('birthDate');
  if (!isValidEmail(input.email)) invalidFields.push('email');
  if (!isValidPhone(input.phone)) invalidFields.push('phone');
  if (!isValidBairro(input.bairro)) invalidFields.push('bairro');
  if (!isValidCity(input.city)) invalidFields.push('city');
  if (!isValidStateUf(input.stateUf)) invalidFields.push('stateUf');
  if (!isValidDesiredRoles(input.desiredRoles)) invalidFields.push('desiredRoles');

  return { valid: invalidFields.length === 0, fields: invalidFields };
}

export function validateCvFile(file: UploadedCvFile | undefined): ValidationResult {
  if (!file) {
    return { valid: false, fields: ['cvFile'] };
  }

  if (file.size <= 0 || file.size > MAX_CV_FILE_SIZE_BYTES) {
    return {
      valid: false,
      fields: ['cvFile'],
      fileError: { error: 'file_too_large', message: 'O arquivo deve ter no máximo 4MB.' },
    };
  }

  const extension = extractExtension(file.originalName);
  const mimeOk = (ACCEPTED_CV_MIME_TYPES as readonly string[]).includes(file.mimeType);
  const extensionOk = (ACCEPTED_CV_EXTENSIONS as readonly string[]).includes(extension);

  if (!mimeOk || !extensionOk) {
    return {
      valid: false,
      fields: ['cvFile'],
      fileError: {
        error: 'file_type_not_allowed',
        message: 'Envie um arquivo nos formatos Word ou PDF.',
      },
    };
  }

  return { valid: true, fields: [] };
}

function extractExtension(fileName: string): string {
  const match = /\.[^.]+$/.exec(fileName.toLowerCase());
  return match ? match[0] : '';
}
