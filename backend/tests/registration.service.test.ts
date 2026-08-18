import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createRegistration, RegistrationServiceDeps } from '../src/services/registration.service';
import { ApiError } from '../src/lib/api-error';
import { RegistrationInput, UploadedCvFile } from '../src/types/registration';

const validInput: RegistrationInput = {
  fullName: 'Maria da Silva',
  birthDate: '1990-04-23',
  email: 'maria.silva@example.com',
  phone: '11987654321',
  bairro: 'Boa Viagem',
  city: 'São Paulo',
  stateUf: 'SP',
  desiredRoles: ['eletricista'],
};

const validFile: UploadedCvFile = {
  originalName: 'curriculo.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  buffer: Buffer.from('fake'),
};

function buildDeps(overrides: Partial<RegistrationServiceDeps> = {}): RegistrationServiceDeps {
  return {
    uploadCvFile: mock.fn(async () => ({ id: 'fixed-id', storagePath: 'fixed-id/curriculo.pdf' })),
    insertRegistration: mock.fn(async () => ({
      id: 'fixed-id',
      createdAt: '2026-08-15T00:00:00.000Z',
    })),
    deleteCvFile: mock.fn(async () => undefined),
    ...overrides,
  };
}

describe('createRegistration', () => {
  it('uploads the file and inserts the row on valid input', async () => {
    const deps = buildDeps();

    const result = await createRegistration(validInput, validFile, deps);

    assert.equal(result.id, 'fixed-id');
    assert.equal((deps.uploadCvFile as ReturnType<typeof mock.fn>).mock.callCount(), 1);
    assert.equal((deps.insertRegistration as ReturnType<typeof mock.fn>).mock.callCount(), 1);
  });

  it('rejects invalid fields without touching storage or the database', async () => {
    const deps = buildDeps();

    await assert.rejects(
      () => createRegistration({ ...validInput, fullName: '' }, validFile, deps),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.httpStatus, 400);
        assert.equal(err.error, 'validation_failed');
        assert.ok(err.fields?.includes('fullName'));
        return true;
      },
    );
    assert.equal((deps.uploadCvFile as ReturnType<typeof mock.fn>).mock.callCount(), 0);
    assert.equal((deps.insertRegistration as ReturnType<typeof mock.fn>).mock.callCount(), 0);
  });

  it('rejects a missing file with a 400 before touching storage', async () => {
    const deps = buildDeps();

    await assert.rejects(
      () => createRegistration(validInput, undefined, deps),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.httpStatus, 400);
        return true;
      },
    );
    assert.equal((deps.uploadCvFile as ReturnType<typeof mock.fn>).mock.callCount(), 0);
  });

  it('deletes the uploaded file and returns 500 when the insert fails', async () => {
    const deps = buildDeps({
      insertRegistration: mock.fn(async () => {
        throw new Error('db down');
      }),
    });

    await assert.rejects(
      () => createRegistration(validInput, validFile, deps),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.httpStatus, 500);
        assert.equal(err.error, 'internal_error');
        return true;
      },
    );
    const deleteMock = deps.deleteCvFile as ReturnType<typeof mock.fn>;
    assert.equal(deleteMock.mock.callCount(), 1);
    assert.equal(deleteMock.mock.calls[0].arguments[0], 'fixed-id/curriculo.pdf');
  });

  it('returns 500 without inserting when the upload itself fails', async () => {
    const deps = buildDeps({
      uploadCvFile: mock.fn(async () => {
        throw new Error('storage down');
      }),
    });

    await assert.rejects(
      () => createRegistration(validInput, validFile, deps),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.httpStatus, 500);
        return true;
      },
    );
    assert.equal((deps.insertRegistration as ReturnType<typeof mock.fn>).mock.callCount(), 0);
  });
});
