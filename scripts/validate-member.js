import fs from 'fs';
import path from 'path';

const MEMBERS_DIR = path.join(process.cwd(), 'members');
const REQUIRED_FIELDS = ['name', 'year', 'school', 'site'];
const VALID_SCHOOLS = new Set([
  'Baruch College',
  'Borough of Manhattan Community College',
  'Bronx Community College',
  'Brooklyn College',
  'College of Staten Island',
  'CUNY School of Labor and Urban Studies',
  'CUNY School of Medicine',
  'CUNY School of Professional Studies',
  'Guttman Community College',
  'Hostos Community College',
  'Hunter College',
  'John Jay College of Criminal Justice',
  'Kingsborough Community College',
  'LaGuardia Community College',
  'Lehman College',
  'Macaulay Honors College',
  'Medgar Evers College',
  'New York City College of Technology',
  'Queens College',
  'Queensborough Community College',
  'The City College of New York',
  'York College'
]);

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidYear(year) {
  return /^[0-9]{4}$/.test(year) && Number(year) >= 1926 && Number(year) <= 2126;
}

function isValidSite(site) {
  if (typeof site !== 'string' || !site.trim()) {
    return false;
  }

  const trimmed = site.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  return /^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(\/.*)?$/.test(trimmed);
}

function validateMember(member, fileName) {
  const errors = [];

  if (!member || typeof member !== 'object' || Array.isArray(member)) {
    errors.push('Member data must be a JSON object.');
    return errors;
  }

  const keys = Object.keys(member);
  for (const field of REQUIRED_FIELDS) {
    if (!keys.includes(field)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (errors.length > 0) {
    return errors;
  }

  const name = normalizeText(member.name);
  const year = normalizeText(member.year);
  const school = normalizeText(member.school);
  const site = normalizeText(member.site);

  if (!name) {
    errors.push('name must be a non-empty string.');
  }

  if (!isValidYear(year)) {
    errors.push('year must be a 4-digit year between 1926 and 2126.');
  }

  if (!school) {
    errors.push('school must be a non-empty string.');
  } else if (!VALID_SCHOOLS.has(school)) {
    errors.push(`school must be one of the official CUNY college names. Received: "${school}".`);
  }

  if (!isValidSite(site)) {
    errors.push('site must be a valid domain or URL (e.g. example.com or https://example.com).');
  }

  return errors;
}

function main() {
  if (!fs.existsSync(MEMBERS_DIR)) {
    fail(`Members directory does not exist: ${MEMBERS_DIR}`);
    return;
  }

  const memberFiles = fs.readdirSync(MEMBERS_DIR).filter((file) => file.endsWith('.json'));

  if (memberFiles.length === 0) {
    fail('No JSON files were found in the members/ directory.');
    return;
  }

  let totalErrors = 0;

  for (const fileName of memberFiles) {
    const filePath = path.join(MEMBERS_DIR, fileName);
    let content;

    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      fail(`Unable to read file ${fileName}: ${error.message}`);
      totalErrors += 1;
      continue;
    }

    let member;
    try {
      member = JSON.parse(content);
    } catch (error) {
      fail(`Invalid JSON in ${fileName}: ${error.message}`);
      totalErrors += 1;
      continue;
    }

    const errors = validateMember(member, fileName);
    if (errors.length > 0) {
      console.error(`\n${fileName} validation failed:`);
      for (const error of errors) {
        console.error(`  - ${error}`);
      }
      totalErrors += 1;
    }
  }

  if (totalErrors > 0) {
    fail(`Validation failed for ${totalErrors} member file(s).`);
  } else {
    console.log(`✅ Validated ${memberFiles.length} member file(s) successfully.`);
  }
}

main();
