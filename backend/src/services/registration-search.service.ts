import { ApiError } from '../lib/api-error';
import { downloadCvFile } from '../repositories/storage.repository';
import { findRegistrations, getRegistrationCvMeta } from '../repositories/registration.repository';
import {
  CandidateSummary,
  DEFAULT_PAGE_SIZE,
  JOB_ROLES,
  BRAZILIAN_STATES,
  PAGE_SIZE_OPTIONS,
  PaginatedRegistrations,
} from '../types/registration';

export interface RawSearchParams {
  jobRole?: unknown;
  city?: unknown;
  uf?: unknown;
  page?: unknown;
  pageSize?: unknown;
}

export interface RegistrationSearchServiceDeps {
  findRegistrations: typeof findRegistrations;
  getRegistrationCvMeta: typeof getRegistrationCvMeta;
  downloadCvFile: typeof downloadCvFile;
}

const defaultDeps: RegistrationSearchServiceDeps = {
  findRegistrations,
  getRegistrationCvMeta,
  downloadCvFile,
};

export function calculateAge(birthDate: string, today: Date = new Date()): number {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const hasHadBirthdayThisYear =
    today.getUTCMonth() > birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() >= birth.getUTCDate());
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }
  return age;
}

function parsePage(value: unknown): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parsePageSize(value: unknown): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : NaN;
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

export async function searchRegistrations(
  params: RawSearchParams,
  deps: RegistrationSearchServiceDeps = defaultDeps,
): Promise<PaginatedRegistrations> {
  const jobRole = typeof params.jobRole === 'string' ? params.jobRole : '';
  if (!jobRole || !(JOB_ROLES as readonly string[]).includes(jobRole)) {
    throw new ApiError(
      400,
      'validation_failed',
      'Selecione uma vaga válida para buscar candidatos.',
      ['jobRole'],
    );
  }

  const city = typeof params.city === 'string' ? params.city.trim() : '';
  const uf = typeof params.uf === 'string' ? params.uf.toUpperCase() : '';
  if (uf && !(BRAZILIAN_STATES as readonly string[]).includes(uf)) {
    throw new ApiError(400, 'validation_failed', 'UF inválida.', ['uf']);
  }

  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.pageSize);

  let rows: Awaited<ReturnType<typeof deps.findRegistrations>>['rows'];
  let total: number;
  try {
    ({ rows, total } = await deps.findRegistrations({
      jobRole,
      city: city || undefined,
      uf: uf || undefined,
      page,
      pageSize,
    }));
  } catch (err) {
    console.error(err);
    throw new ApiError(500, 'internal_error', 'Não foi possível carregar os candidatos. Tente novamente.');
  }

  const items: CandidateSummary[] = rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    age: calculateAge(row.birth_date),
    city: row.city,
    stateUf: row.state_uf,
  }));

  return { items, total, page, pageSize };
}

export interface RegistrationCvDownload {
  fileName: string;
  contentType: string;
  buffer: Buffer;
}

export async function downloadRegistrationCv(
  id: string,
  deps: RegistrationSearchServiceDeps = defaultDeps,
): Promise<RegistrationCvDownload> {
  const meta = await deps.getRegistrationCvMeta(id);
  if (!meta) {
    throw new ApiError(404, 'not_found', 'Currículo não encontrado.');
  }

  let buffer: Buffer | null;
  try {
    buffer = await deps.downloadCvFile(meta.storagePath);
  } catch (err) {
    console.error(err);
    throw new ApiError(500, 'internal_error', 'Não foi possível baixar o currículo. Tente novamente.');
  }
  if (!buffer) {
    throw new ApiError(404, 'not_found', 'Currículo não encontrado.');
  }

  return { fileName: meta.fileName, contentType: meta.contentType, buffer };
}
