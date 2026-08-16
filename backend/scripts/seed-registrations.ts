/**
 * Load script: seeds the Supabase `registrations` table (and the matching
 * files in the `curriculos` storage bucket) with fake candidate data for
 * local/demo testing of the "Filtrar currículos" screen.
 *
 * Usage:
 *   cd backend && npm run seed
 *
 * Requires backend/.env with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * SUPABASE_BUCKET pointing at a project where the `registrations` table
 * (see ../../specs/001-cadastro-curriculo/data-model.md) and the private
 * `curriculos` bucket already exist.
 *
 * Every run inserts 50 NEW records — it is not idempotent and does not
 * delete anything.
 */
import { randomUUID } from 'node:crypto';
import { getBucketName, getSupabaseClient } from '../src/lib/supabase';
import { JOB_ROLES, JobRole } from '../src/types/registration';

const TOTAL_RECORDS = 50;
const MIN_AGE = 18;
const MAX_AGE = 45;

interface CityOption {
  city: string;
  uf: string;
  ddd: string;
}

const CITY_OPTIONS: CityOption[] = [
  { city: 'Recife', uf: 'PE', ddd: '81' },
  { city: 'Olinda', uf: 'PE', ddd: '81' },
  { city: 'Paulista', uf: 'PE', ddd: '81' },
  { city: 'João Pessoa', uf: 'PB', ddd: '83' },
  { city: 'Maceió', uf: 'AL', ddd: '82' },
];

const FIRST_NAMES = [
  'Ana', 'Bruno', 'Carla', 'Daniel', 'Eduarda', 'Fábio', 'Gabriela', 'Hugo',
  'Isabela', 'João', 'Karina', 'Leonardo', 'Mariana', 'Nicolas', 'Otávio',
  'Paula', 'Rafael', 'Sabrina', 'Thiago', 'Vitória', 'Wesley', 'Yasmin',
  'Camila', 'Diego', 'Elaine', 'Felipe', 'Gustavo', 'Helena', 'Igor',
  'Juliana', 'Larissa', 'Marcelo', 'Natália', 'Pedro', 'Renata',
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Almeida',
  'Ferreira', 'Rodrigues', 'Gomes', 'Martins', 'Araújo', 'Barbosa',
  'Ribeiro', 'Carvalho', 'Lima', 'Cavalcante', 'Nascimento', 'Monteiro',
  'Correia', 'Melo', 'Andrade', 'Nunes', 'Moura', 'Cardoso',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function pickSubset<T>(items: readonly T[], min: number, max: number): T[] {
  const count = randomInt(min, Math.min(max, items.length));
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function buildFullName(): string {
  const first = pickOne(FIRST_NAMES);
  const last1 = pickOne(LAST_NAMES);
  const last2 = pickOne(LAST_NAMES.filter((name) => name !== last1));
  return `${first} ${last1} ${last2}`;
}

function buildEmail(fullName: string, index: number): string {
  const slug = stripAccents(fullName).toLowerCase().replace(/\s+/g, '.');
  return `${slug}.${index}@example.com`;
}

function buildPhone(ddd: string): string {
  const subscriber = String(randomInt(0, 99999999)).padStart(8, '0');
  return `${ddd}9${subscriber}`;
}

function buildBirthDate(): string {
  const today = new Date();
  const age = randomInt(MIN_AGE, MAX_AGE);
  const year = today.getUTCFullYear() - age;
  const month = randomInt(1, 12);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = randomInt(1, daysInMonth);

  let date = new Date(Date.UTC(year, month - 1, day));
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (date.getTime() > todayUtc.getTime()) {
    date = new Date(Date.UTC(year - 1, month - 1, day));
  }
  return date.toISOString().slice(0, 10);
}

function buildDesiredRoles(): JobRole[] {
  return pickSubset(JOB_ROLES, 1, 3) as JobRole[];
}

/** Builds a small, structurally valid single-page PDF with the candidate's name. */
function buildFakeCvPdf(candidateName: string): Buffer {
  const safeName = candidateName.replace(/[()\\]/g, '');
  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 300 200] /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];
  const content = `BT /F1 14 Tf 20 150 Td (Curriculo - ${safeName}) Tj ET`;
  objects.push(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefStart = pdf.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += xref;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

interface SeedRecord {
  id: string;
  full_name: string;
  birth_date: string;
  email: string;
  phone: string;
  city: string;
  state_uf: string;
  desired_roles: JobRole[];
  cv_file_name: string;
  cv_file_size: number;
  cv_content_type: string;
  cv_storage_path: string;
}

async function main(): Promise<void> {
  const supabase = getSupabaseClient();
  const bucket = getBucketName();

  console.log(`Seeding ${TOTAL_RECORDS} registrations into bucket "${bucket}"...`);

  const records: SeedRecord[] = [];

  for (let i = 0; i < TOTAL_RECORDS; i += 1) {
    const id = randomUUID();
    const fullName = buildFullName();
    const { city, uf, ddd } = pickOne(CITY_OPTIONS);
    const pdf = buildFakeCvPdf(fullName);
    const storagePath = `${id}/curriculo.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, pdf, { contentType: 'application/pdf', upsert: false });

    if (uploadError) {
      throw new Error(`Failed to upload CV for "${fullName}" (${storagePath}): ${uploadError.message}`);
    }

    records.push({
      id,
      full_name: fullName,
      birth_date: buildBirthDate(),
      email: buildEmail(fullName, i + 1),
      phone: buildPhone(ddd),
      city,
      state_uf: uf,
      desired_roles: buildDesiredRoles(),
      cv_file_name: 'curriculo.pdf',
      cv_file_size: pdf.length,
      cv_content_type: 'application/pdf',
      cv_storage_path: storagePath,
    });

    process.stdout.write(`  uploaded ${i + 1}/${TOTAL_RECORDS}\r`);
  }

  console.log(`\nInserting ${records.length} rows into "registrations"...`);

  const { data, error: insertError } = await supabase
    .from('registrations')
    .insert(records)
    .select('id');

  if (insertError) {
    throw new Error(`Failed to insert registrations: ${insertError.message}`);
  }

  console.log(`Done. Inserted ${data?.length ?? 0} registrations.`);

  const byCity = records.reduce<Record<string, number>>((acc, r) => {
    acc[`${r.city}/${r.state_uf}`] = (acc[`${r.city}/${r.state_uf}`] ?? 0) + 1;
    return acc;
  }, {});
  console.log('Distribution by city:', byCity);

  const roleCounts = records.reduce<Record<string, number>>((acc, r) => {
    for (const role of r.desired_roles) acc[role] = (acc[role] ?? 0) + 1;
    return acc;
  }, {});
  console.log('Distribution by role:', roleCounts);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exitCode = 1;
});
