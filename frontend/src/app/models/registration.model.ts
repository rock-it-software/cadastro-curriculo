export interface JobRoleOption {
  value: string;
  label: string;
}

export const JOB_ROLE_OPTIONS: JobRoleOption[] = [
  { value: 'pedreiro', label: 'Pedreiro' },
  { value: 'ajudante_pedreiro', label: 'Ajudante de pedreiro' },
  { value: 'eletricista', label: 'Eletricista' },
  { value: 'motorista', label: 'Motorista' },
  { value: 'cozinheiro', label: 'Cozinheiro' },
  { value: 'marceneiro', label: 'Marceneiro' },
  { value: 'tecnico_seguranca_trabalho', label: 'Técnico em segurança do trabalho' },
  { value: 'porteiro', label: 'Porteiro' },
  { value: 'outros', label: 'Outros' },
];

export const ACCEPTED_CV_EXTENSIONS = ['.pdf', '.doc', '.docx'];

export const ACCEPTED_CV_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MAX_CV_FILE_SIZE_BYTES = 4 * 1024 * 1024;

export interface RegistrationFormValue {
  fullName: string;
  birthDate: Date | null;
  email: string;
  phone: string;
  city: string;
  stateUf: string;
  desiredRoles: string[];
}

export interface RegistrationCreatedResponse {
  id: string;
  createdAt: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  fields?: string[];
}
