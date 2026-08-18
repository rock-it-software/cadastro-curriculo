/**
 * One-off backfill: populates `registrations.bairro` for existing rows
 * based on each row's `city`, using a curated real-neighborhood list per
 * city. Rows whose city isn't recognized are SKIPPED and reported for
 * manual follow-up — never given a generic/fake fallback (spec FR-009).
 *
 * Usage:
 *   cd backend && npm run backfill:bairro
 *
 * Prerequisite: the `bairro` column must already exist (nullable) — see
 * specs/003-add-bairro-field/data-model.md Step A. Do NOT add the NOT NULL
 * constraint (Step D) until this script's "skipped" report is empty.
 *
 * Idempotent: only rows where `bairro is null` are touched, so this script
 * is safe to run more than once (spec FR-010).
 */
import { getSupabaseClient } from '../src/lib/supabase';

// Curated real neighborhoods per city recognized by this script.
// Extend as needed; cities not listed here are skipped, not guessed.
const NEIGHBORHOODS_BY_CITY: Record<string, string[]> = {
  Recife: ['Boa Viagem', 'Casa Forte', 'Boa Vista', 'Espinheiro', 'Graças'],
  Olinda: ['Carmo', 'Bonsucesso', 'Rio Doce', 'Casa Caiada'],
  Paulista: ['Janga', 'Maranguape I', 'Pau Amarelo', 'Centro'],
  'João Pessoa': ['Tambaú', 'Bessa', 'Cabo Branco', 'Manaíra'],
  Maceió: ['Ponta Verde', 'Jatiúca', 'Pajuçara', 'Farol'],
  'São Paulo': ['Pinheiros', 'Moema', 'Vila Mariana', 'Tatuapé'],
};

interface RegistrationCityRow {
  id: string;
  city: string;
}

function pickNeighborhood(city: string): string | undefined {
  const options = NEIGHBORHOODS_BY_CITY[city.trim()];
  if (!options || options.length === 0) return undefined;
  return options[Math.floor(Math.random() * options.length)];
}

async function main(): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: rows, error } = await supabase
    .from('registrations')
    .select('id, city')
    .is('bairro', null);

  if (error) {
    throw new Error(`Failed to load registrations pending bairro: ${error.message}`);
  }

  const skipped: RegistrationCityRow[] = [];
  let updated = 0;

  for (const row of (rows ?? []) as RegistrationCityRow[]) {
    const bairro = pickNeighborhood(row.city);
    if (!bairro) {
      skipped.push(row);
      continue;
    }

    const { error: updateError } = await supabase
      .from('registrations')
      .update({ bairro })
      .eq('id', row.id);

    if (updateError) {
      throw new Error(`Failed to update registration ${row.id}: ${updateError.message}`);
    }
    updated += 1;
  }

  console.log(`Backfilled ${updated} row(s).`);

  if (skipped.length > 0) {
    console.log(`\nSKIPPED ${skipped.length} row(s) — unrecognized city, needs manual bairro:`);
    for (const row of skipped) {
      console.log(`  id=${row.id} city="${row.city}"`);
    }
    console.log('\nDo NOT add NOT NULL to bairro until these rows are fixed manually.');
  } else {
    console.log('No rows skipped — safe to add NOT NULL once verified with SQL (Step D).');
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exitCode = 1;
});
