import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

import { RecruiterSearchService } from '../../services/recruiter-search.service';
import { providePtBrPaginatorIntl } from '../../shared/i18n/mat-paginator-intl-pt-br';
import { BRAZILIAN_STATES } from '../../shared/constants/uf.constant';
import { JOB_ROLE_OPTIONS } from '../../models/registration.model';
import {
  CandidateSummary,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from '../../models/candidate-summary.model';

@Component({
  selector: 'app-recruiter-search',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './recruiter-search.html',
  styleUrl: './recruiter-search.scss',
  providers: [{ provide: MatPaginatorIntl, useFactory: providePtBrPaginatorIntl }],
})
export class RecruiterSearch {
  private readonly fb = inject(FormBuilder);
  private readonly searchService = inject(RecruiterSearchService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly jobRoleOptions = JOB_ROLE_OPTIONS;
  readonly ufOptions = BRAZILIAN_STATES;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly displayedColumns = ['fullName', 'age', 'bairro', 'city', 'stateUf', 'download'];

  readonly form = this.fb.group({
    jobRole: this.fb.control<string>(''),
    bairro: this.fb.control<string>(''),
    city: this.fb.control<string>(''),
    uf: this.fb.control<string>(''),
  });

  items: CandidateSummary[] = [];
  total = 0;
  page = 1;
  pageSize = DEFAULT_PAGE_SIZE;
  loading = false;
  searched = false;

  constructor() {
    this.form.controls.jobRole.valueChanges.subscribe(() => this.runSearch(true));
    this.form.controls.uf.valueChanges.subscribe(() => this.runSearch(true));
  }

  onBairroBlur(): void {
    this.runSearch(true);
  }

  onCityBlur(): void {
    this.runSearch(true);
  }

  onPageChange(event: PageEvent): void {
    if (event.pageSize !== this.pageSize) {
      this.pageSize = event.pageSize;
      this.page = 1;
    } else {
      this.page = event.pageIndex + 1;
    }
    this.runSearch(false);
  }

  downloadCv(candidate: CandidateSummary): void {
    this.searchService.downloadCv(candidate.id).subscribe({
      error: () => {
        this.snackBar.open(
          `Não foi possível baixar o currículo de ${candidate.fullName}. Tente novamente.`,
          'Fechar',
          { duration: 5000 },
        );
      },
    });
  }

  get selectedJobRoleLabel(): string | null {
    const value = this.form.controls.jobRole.value;
    return this.jobRoleOptions.find((option) => option.value === value)?.label ?? null;
  }

  private runSearch(resetPage: boolean): void {
    const jobRole = this.form.controls.jobRole.value;
    if (!jobRole) {
      this.searched = false;
      this.items = [];
      this.total = 0;
      return;
    }

    if (resetPage) {
      this.page = 1;
    }

    const bairro = this.form.controls.bairro.value?.trim() || undefined;
    const city = this.form.controls.city.value?.trim() || undefined;
    const uf = this.form.controls.uf.value || undefined;

    this.loading = true;
    this.searchService
      .search({ jobRole, bairro, city, uf, page: this.page, pageSize: this.pageSize })
      .subscribe({
        next: (result) => {
          this.loading = false;
          this.searched = true;
          this.items = result.items;
          this.total = result.total;
          this.page = result.page;
          this.pageSize = result.pageSize;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.searched = true;
          this.items = [];
          this.total = 0;
          this.cdr.markForCheck();
          this.snackBar.open(
            'Não foi possível carregar os candidatos. Tente novamente.',
            'Fechar',
            { duration: 5000 },
          );
        },
      });
  }
}
