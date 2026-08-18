import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAge,
  downloadRegistrationCv,
  RegistrationSearchServiceDeps,
  searchRegistrations,
} from '../src/services/registration-search.service';
import { ApiError } from '../src/lib/api-error';
import { RegistrationSearchRow } from '../src/repositories/registration.repository';

const sampleRow: RegistrationSearchRow = {
  id: 'candidate-1',
  full_name: 'Maria da Silva',
  birth_date: '1990-04-23',
  bairro: 'Pinheiros',
  city: 'São Paulo',
  state_uf: 'SP',
};

function buildDeps(overrides: Partial<RegistrationSearchServiceDeps> = {}): RegistrationSearchServiceDeps {
  return {
    findRegistrations: mock.fn(async () => ({ rows: [sampleRow], total: 1 })),
    getRegistrationCvMeta: mock.fn(async () => ({
      storagePath: 'candidate-1/curriculo.pdf',
      fileName: 'curriculo.pdf',
      contentType: 'application/pdf',
    })),
    downloadCvFile: mock.fn(async () => Buffer.from('fake pdf')),
    ...overrides,
  };
}

describe('calculateAge', () => {
  it('returns completed years when the birthday already happened this year', () => {
    assert.equal(calculateAge('1990-04-23', new Date('2026-08-15T00:00:00Z')), 36);
  });

  it('does not count the year yet when the birthday has not happened this year', () => {
    assert.equal(calculateAge('1990-12-25', new Date('2026-08-15T00:00:00Z')), 35);
  });

  it('counts the birthday itself as already completed', () => {
    assert.equal(calculateAge('1990-08-15', new Date('2026-08-15T00:00:00Z')), 36);
  });
});

describe('searchRegistrations', () => {
  it('rejects a missing jobRole without querying the database', async () => {
    const deps = buildDeps();

    await assert.rejects(
      () => searchRegistrations({}, deps),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.httpStatus, 400);
        assert.equal(err.fields?.[0], 'jobRole');
        return true;
      },
    );
    assert.equal((deps.findRegistrations as ReturnType<typeof mock.fn>).mock.callCount(), 0);
  });

  it('rejects a jobRole outside the accepted set', async () => {
    const deps = buildDeps();

    await assert.rejects(() => searchRegistrations({ jobRole: 'astronauta' }, deps), ApiError);
    assert.equal((deps.findRegistrations as ReturnType<typeof mock.fn>).mock.callCount(), 0);
  });

  it('rejects a uf outside the 27-code set', async () => {
    const deps = buildDeps();

    await assert.rejects(
      () => searchRegistrations({ jobRole: 'eletricista', uf: 'ZZ' }, deps),
      ApiError,
    );
    assert.equal((deps.findRegistrations as ReturnType<typeof mock.fn>).mock.callCount(), 0);
  });

  it('queries with jobRole only and maps rows to CandidateSummary with computed age', async () => {
    const deps = buildDeps();

    const result = await searchRegistrations({ jobRole: 'eletricista' }, deps);

    const call = (deps.findRegistrations as ReturnType<typeof mock.fn>).mock.calls[0];
    assert.deepEqual(call.arguments[0], {
      jobRole: 'eletricista',
      bairro: undefined,
      city: undefined,
      uf: undefined,
      page: 1,
      pageSize: 20,
    });
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].id, 'candidate-1');
    assert.equal(result.items[0].fullName, 'Maria da Silva');
    assert.equal(result.total, 1);
  });

  it('trims city and uppercases uf before querying', async () => {
    const deps = buildDeps();

    await searchRegistrations({ jobRole: 'eletricista', city: '  Campinas  ', uf: 'sp' }, deps);

    const call = (deps.findRegistrations as ReturnType<typeof mock.fn>).mock.calls[0];
    assert.equal(call.arguments[0].city, 'Campinas');
    assert.equal(call.arguments[0].uf, 'SP');
  });

  it('trims bairro before querying', async () => {
    const deps = buildDeps();

    await searchRegistrations({ jobRole: 'eletricista', bairro: '  Boa Viagem  ' }, deps);

    const call = (deps.findRegistrations as ReturnType<typeof mock.fn>).mock.calls[0];
    assert.equal(call.arguments[0].bairro, 'Boa Viagem');
  });

  it('clamps invalid page and pageSize to the defaults', async () => {
    const deps = buildDeps();

    const result = await searchRegistrations(
      { jobRole: 'eletricista', page: '-3', pageSize: '999' },
      deps,
    );

    assert.equal(result.page, 1);
    assert.equal(result.pageSize, 20);
  });

  it('accepts a valid page and pageSize from the allowed set', async () => {
    const deps = buildDeps();

    const result = await searchRegistrations(
      { jobRole: 'eletricista', page: '2', pageSize: '50' },
      deps,
    );

    const call = (deps.findRegistrations as ReturnType<typeof mock.fn>).mock.calls[0];
    assert.equal(call.arguments[0].page, 2);
    assert.equal(call.arguments[0].pageSize, 50);
    assert.equal(result.page, 2);
    assert.equal(result.pageSize, 50);
  });
});

describe('downloadRegistrationCv', () => {
  it('returns the file buffer, name, and content type when found', async () => {
    const deps = buildDeps();

    const result = await downloadRegistrationCv('candidate-1', deps);

    assert.equal(result.fileName, 'curriculo.pdf');
    assert.equal(result.contentType, 'application/pdf');
    assert.ok(Buffer.isBuffer(result.buffer));
  });

  it('returns 404 when the registration does not exist', async () => {
    const deps = buildDeps({ getRegistrationCvMeta: mock.fn(async () => null) });

    await assert.rejects(
      () => downloadRegistrationCv('missing-id', deps),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.httpStatus, 404);
        return true;
      },
    );
  });

  it('returns 404 when the storage object is missing', async () => {
    const deps = buildDeps({ downloadCvFile: mock.fn(async () => null) });

    await assert.rejects(
      () => downloadRegistrationCv('candidate-1', deps),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.httpStatus, 404);
        return true;
      },
    );
  });

  it('returns 500 when the storage download fails unexpectedly', async () => {
    const deps = buildDeps({
      downloadCvFile: mock.fn(async () => {
        throw new Error('storage unavailable');
      }),
    });

    await assert.rejects(
      () => downloadRegistrationCv('candidate-1', deps),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.httpStatus, 500);
        return true;
      },
    );
  });
});
