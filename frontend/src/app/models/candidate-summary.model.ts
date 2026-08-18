export interface CandidateSummary {
  id: string;
  fullName: string;
  age: number;
  bairro: string;
  city: string;
  stateUf: string;
}

export interface PaginatedRegistrations {
  items: CandidateSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;

export interface RegistrationsSearchFilter {
  jobRole: string;
  bairro?: string;
  city?: string;
  uf?: string;
  page?: number;
  pageSize?: number;
}
