import { getSupabaseClient } from '../lib/supabase';
import { RegistrationInput, RegistrationRecord, UploadedCvFile } from '../types/registration';

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
