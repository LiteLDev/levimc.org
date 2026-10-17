// Supporters listed on /support/. The list lives in public/donors.csv (still served at /donors.csv) and is
// read at build time, so the page is prerendered with every supporter instead of fetching the CSV later.
import donorsCsv from '../../public/donors.csv?raw';

export interface DonorEntry {
  name: string;
  amount: string;
  message: string;
  date: string;
  link: string;
}

function splitCsvRow(row: string) {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];

    if (character === '"') {
      if (inQuotes && row[index + 1] === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue.trim());
  return values;
}

export function parseDonorsCsv(csvText: string): DonorEntry[] {
  const rows = csvText
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter((row) => row.length > 0);

  if (rows.length < 2) {
    return [];
  }

  const headers = splitCsvRow(rows[0]!).map((header) => header.trim().toLowerCase());

  return rows
    .slice(1)
    .map((row) => {
      const values = splitCsvRow(row);
      const record = headers.reduce<Record<string, string>>((accumulator, header, index) => {
        accumulator[header] = values[index] ?? '';
        return accumulator;
      }, {});

      return {
        name: record.name || record.nickname || 'Anonymous',
        amount: record.amount || record.value || '',
        message: record.message || record.note || '',
        date: record.date || record.time || '',
        link: record.link || record.url || '',
      };
    })
    .filter((donor) => donor.name.length > 0);
}

export const DONORS: readonly DonorEntry[] = parseDonorsCsv(donorsCsv);
