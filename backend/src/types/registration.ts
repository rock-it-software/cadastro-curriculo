export const JOB_ROLES = [
  'pedreiro',
  'ajudante_pedreiro',
  'eletricista',
  'motorista',
  'cozinheiro',
  'marceneiro',
  'tecnico_seguranca_trabalho',
  'porteiro',
  'outros',
] as const;

export type JobRole = (typeof JOB_ROLES)[number];

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
] as const;

export type StateUf = (typeof BRAZILIAN_STATES)[number];

export const ACCEPTED_CV_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const ACCEPTED_CV_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;

export const MAX_CV_FILE_SIZE_BYTES = 4 * 1024 * 1024;

export interface RegistrationInput {
  fullName: string;
  birthDate: string;
  email: string;
  phone: string;
  city: string;
  stateUf: string;
  desiredRoles: string[];
}

export interface UploadedCvFile {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export interface ValidationResult {
  valid: boolean;
  fields: string[];
  fileError?: { error: 'file_too_large' | 'file_type_not_allowed'; message: string };
}

export interface RegistrationRecord {
  id: string;
  createdAt: string;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  fields?: string[];
}
