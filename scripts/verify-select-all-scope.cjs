const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourceRoots = [
  path.join(root, 'src', 'pages'),
  path.join(root, 'src', 'components'),
];

const forbiddenPatterns = [
  {
    pattern: /toggleSelectAll\(\s*paginatedIds\s*\)/,
    message: 'select-all must use filteredIds, not paginatedIds',
  },
  {
    pattern: /isEveryIdSelected\(\s*selected\s*,\s*paginatedIds\s*\)/,
    message: 'select-all checked state must cover filteredIds, not paginatedIds',
  },
  {
    pattern: /paginatedIds\.every\(\s*\(?id\)?\s*=>\s*next\.has\(id\)\s*\)/,
    message: 'local select-all toggle must compare filteredIds, not paginatedIds',
  },
  {
    pattern: /paginatedIds\.forEach\(\s*\(?id\)?\s*=>\s*next\.(?:add|delete)\(id\)\s*\)/,
    message: 'local select-all toggle must mutate filteredIds, not paginatedIds',
  },
];

function collectTsxFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectTsxFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith('.tsx') ? [fullPath] : [];
  });
}

const failures = [];

for (const filePath of sourceRoots.flatMap(collectTsxFiles)) {
  const relativePath = path.relative(root, filePath).replaceAll(path.sep, '/');
  const source = fs.readFileSync(filePath, 'utf8');

  for (const { pattern, message } of forbiddenPatterns) {
    if (pattern.test(source)) {
      failures.push(`${relativePath}: ${message}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Select-all scope verification failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Select-all scope verification passed.');
