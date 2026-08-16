import { ApiError } from '../lib/api-error';
import { deleteCvFile, uploadCvFile } from '../repositories/storage.repository';
import { insertRegistration } from '../repositories/registration.repository';
import { RegistrationInput, RegistrationRecord, UploadedCvFile } from '../types/registration';
import { validateCvFile, validateRegistrationFields } from './validation.service';

export interface RegistrationServiceDeps {
  uploadCvFile: typeof uploadCvFile;
  insertRegistration: typeof insertRegistration;
  deleteCvFile: typeof deleteCvFile;
}

const defaultDeps: RegistrationServiceDeps = { uploadCvFile, insertRegistration, deleteCvFile };

export async function createRegistration(
  input: RegistrationInput,
  file: UploadedCvFile | undefined,
  deps: RegistrationServiceDeps = defaultDeps,
): Promise<RegistrationRecord> {
  const fieldsResult = validateRegistrationFields(input);
  const fileResult = validateCvFile(file);

  if (!fieldsResult.valid || !fileResult.valid) {
    if (fileResult.fileError) {
      throw new ApiError(400, fileResult.fileError.error, fileResult.fileError.message);
    }
    const fields = [...fieldsResult.fields, ...fileResult.fields];
    throw new ApiError(400, 'validation_failed', 'Preencha todos os campos', fields);
  }

  let storagePath: string;
  let id: string;
  try {
    const uploaded = await deps.uploadCvFile(file as UploadedCvFile);
    id = uploaded.id;
    storagePath = uploaded.storagePath;
  } catch (err) {
    console.error(err);
    throw new ApiError(500, 'internal_error', 'Não foi possível salvar. Tente novamente.');
  }

  try {
    return await deps.insertRegistration({ id, input, file: file as UploadedCvFile, storagePath });
  } catch (err) {
    console.error(err);
    await deps.deleteCvFile(storagePath).catch((cleanupErr) => console.error(cleanupErr));
    throw new ApiError(500, 'internal_error', 'Não foi possível salvar. Tente novamente.');
  }
}
