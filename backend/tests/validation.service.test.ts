import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidBairro,
  isValidBirthDate,
  isValidCity,
  isValidDesiredRoles,
  isValidEmail,
  isValidFullName,
  isValidPhone,
  isValidStateUf,
  validateCvFile,
  validateRegistrationFields,
} from '../src/services/validation.service';
import { RegistrationInput, UploadedCvFile } from '../src/types/registration';

const validInput: RegistrationInput = {
  fullName: 'Maria da Silva',
  birthDate: '1990-04-23',
  email: 'maria.silva@example.com',
  phone: '11987654321',
  bairro: 'Boa Viagem',
  city: 'São Paulo',
  stateUf: 'SP',
  desiredRoles: ['eletricista', 'motorista'],
};

function buildFile(overrides: Partial<UploadedCvFile> = {}): UploadedCvFile {
  return {
    originalName: 'curriculo.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('fake'),
    ...overrides,
  };
}

describe('isValidFullName', () => {
  it('accepts a normal name', () => assert.equal(isValidFullName('Maria da Silva'), true));
  it('rejects an empty name', () => assert.equal(isValidFullName('   '), false));
  it('rejects a name over 100 chars', () => assert.equal(isValidFullName('a'.repeat(101)), false));
  it('accepts exactly 100 chars', () => assert.equal(isValidFullName('a'.repeat(100)), true));
});

describe('isValidBirthDate', () => {
  it('accepts a past date', () => assert.equal(isValidBirthDate('1990-04-23'), true));
  it('accepts today', () => {
    const today = new Date().toISOString().slice(0, 10);
    assert.equal(isValidBirthDate(today), true);
  });
  it('rejects a future date', () => {
    const future = new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10);
    assert.equal(isValidBirthDate(future), false);
  });
  it('rejects a malformed date', () => assert.equal(isValidBirthDate('23/04/1990'), false));
});

describe('isValidEmail', () => {
  it('accepts a valid email', () => assert.equal(isValidEmail('a@b.com'), true));
  it('rejects a missing @', () => assert.equal(isValidEmail('a-b.com'), false));
});

describe('isValidPhone', () => {
  it('accepts a 10-digit landline', () => assert.equal(isValidPhone('1133334444'), true));
  it('accepts an 11-digit mobile with 9', () => assert.equal(isValidPhone('11987654321'), true));
  it('rejects an 11-digit number without leading 9', () =>
    assert.equal(isValidPhone('11887654321'), false));
  it('rejects too few digits', () => assert.equal(isValidPhone('123'), false));
  it('strips mask characters before validating', () =>
    assert.equal(isValidPhone('(11) 98765-4321'), true));
});

describe('isValidBairro', () => {
  it('accepts a normal bairro name', () => assert.equal(isValidBairro('Boa Viagem'), true));
  it('rejects empty', () => assert.equal(isValidBairro(''), false));
  it('rejects over 100 chars', () => assert.equal(isValidBairro('a'.repeat(101)), false));
});

describe('isValidCity', () => {
  it('accepts a normal city name', () => assert.equal(isValidCity('São Paulo'), true));
  it('rejects empty', () => assert.equal(isValidCity(''), false));
  it('rejects over 100 chars', () => assert.equal(isValidCity('a'.repeat(101)), false));
});

describe('isValidStateUf', () => {
  it('accepts a valid UF', () => assert.equal(isValidStateUf('RJ'), true));
  it('accepts lowercase and normalizes', () => assert.equal(isValidStateUf('rj'), true));
  it('rejects an invalid code', () => assert.equal(isValidStateUf('XX'), false));
});

describe('isValidDesiredRoles', () => {
  it('accepts one valid role', () => assert.equal(isValidDesiredRoles(['pedreiro']), true));
  it('accepts multiple valid roles', () =>
    assert.equal(isValidDesiredRoles(['pedreiro', 'motorista']), true));
  it('rejects an empty array', () => assert.equal(isValidDesiredRoles([]), false));
  it('rejects an unknown role', () => assert.equal(isValidDesiredRoles(['inventado']), false));
});

describe('validateRegistrationFields', () => {
  it('passes for a fully valid input', () => {
    const result = validateRegistrationFields(validInput);
    assert.equal(result.valid, true);
    assert.deepEqual(result.fields, []);
  });

  it('lists every invalid field', () => {
    const result = validateRegistrationFields({
      ...validInput,
      fullName: '',
      email: 'not-an-email',
      desiredRoles: [],
    });
    assert.equal(result.valid, false);
    assert.deepEqual(result.fields.sort(), ['desiredRoles', 'email', 'fullName']);
  });

  it('flags an invalid bairro', () => {
    const result = validateRegistrationFields({ ...validInput, bairro: '' });
    assert.equal(result.valid, false);
    assert.deepEqual(result.fields, ['bairro']);
  });
});

describe('validateCvFile', () => {
  it('passes for a valid PDF under 4MB', () => {
    assert.equal(validateCvFile(buildFile()).valid, true);
  });

  it('rejects a missing file', () => {
    const result = validateCvFile(undefined);
    assert.equal(result.valid, false);
    assert.deepEqual(result.fields, ['cvFile']);
  });

  it('rejects a file over 4MB with file_too_large', () => {
    const result = validateCvFile(buildFile({ size: 4 * 1024 * 1024 + 1 }));
    assert.equal(result.valid, false);
    assert.equal(result.fileError?.error, 'file_too_large');
  });

  it('accepts a file at exactly the 4MB boundary', () => {
    const result = validateCvFile(buildFile({ size: 4 * 1024 * 1024 }));
    assert.equal(result.valid, true);
  });

  it('rejects a disallowed extension with file_type_not_allowed', () => {
    const result = validateCvFile(
      buildFile({ originalName: 'curriculo.txt', mimeType: 'text/plain' }),
    );
    assert.equal(result.valid, false);
    assert.equal(result.fileError?.error, 'file_type_not_allowed');
  });

  it('accepts a .docx file', () => {
    const result = validateCvFile(
      buildFile({
        originalName: 'curriculo.docx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
    );
    assert.equal(result.valid, true);
  });
});
