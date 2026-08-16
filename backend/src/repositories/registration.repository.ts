import { getSupabaseClient } from '../lib/supabase';
import {
  RegistrationCvMeta,
  RegistrationInput,
  RegistrationRecord,
  RegistrationsSearchQuery,
  UploadedCvFile,
} from '../types/registration';

export interface InsertRegistrationParams {
  id: string;
  input: RegistrationInput;
  file: UploadedCvFile;
  storagePath: string;
}

export async function insertRegistration(
  params: InsertRegistrationParams,
): Promise<RegistrationRecord> {
  const { id, input, file, storagePath } = params;

  const { data, error } = await getSupabaseClient()
    .from('registrations')
    .insert({
      id,
      full_name: input.fullName.trim(),
      birth_date: input.birthDate,
      email: input.email.trim(),
      phone: input.phone.replace(/\D/g, ''),
      city: input.city.trim(),
      state_uf: input.stateUf.toUpperCase(),
      desired_roles: input.desiredRoles,
      cv_file_name: file.originalName,
      cv_file_size: file.size,
      cv_content_type: file.mimeType,
      cv_storage_path: storagePath,
    })
    .select('id, created_at')
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert registration: ${error?.message ?? 'unknown error'}`);
  }

  return { id: data.id as string, createdAt: data.created_at as string };
}

export interface RegistrationSearchRow {
  id: string;
  full_name: string;
  birth_date: string;
  city: string;
  state_uf: string;
}

export interface RegistrationSearchResult {
  rows: RegistrationSearchRow[];
  total: number;
}

export async function findRegistrations(
  query: RegistrationsSearchQuery,
): Promise<RegistrationSearchResult> {
  const { jobRole, city, uf, page, pageSize } = query;
  const offset = (page - 1) * pageSize;

  let builder = getSupabaseClient()
    .from('registrations')
    .select('id, full_name, birth_date, city, state_uf', { count: 'exact' })
    .contains('desired_roles', [jobRole]);

  if (city) {
    builder = builder.ilike('city', `%${city}%`);
  }
  if (uf) {
    builder = builder.eq('state_uf', uf);
  }

  const { data, error, count } = await builder
    .order('created_at', { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (error) {
    throw new Error(`Failed to search registrations: ${error.message}`);
  }

  return { rows: (data ?? []) as RegistrationSearchRow[], total: count ?? 0 };
}

export async function getRegistrationCvMeta(id: string): Promise<RegistrationCvMeta | null> {
  const { data, error } = await getSupabaseClient()
    .from('registrations')
    .select('cv_storage_path, cv_file_name, cv_content_type')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load registration CV metadata: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  return {
    storagePath: data.cv_storage_path as string,
    fileName: data.cv_file_name as string,
    contentType: data.cv_content_type as string,
  };
}
