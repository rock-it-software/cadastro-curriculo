import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function notFutureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as Date | null;
    if (!value) return null;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return value.getTime() > today.getTime() ? { futureDate: true } : null;
  };
}

export function brazilianPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    if (!value) return null;
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 10 && digits.length !== 11) return { brPhone: true };
    if (digits.length === 11 && digits[2] !== '9') return { brPhone: true };
    return null;
  };
}

export function atLeastOneCheckedValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string[] | null;
    return value && value.length > 0 ? null : { required: true };
  };
}
