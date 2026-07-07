const { readdirSync, statSync } = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');
const vitestEntrypoint = path.join(projectRoot, 'node_modules', 'vitest', 'vitest.mjs');
const batchSize = Number(process.env.VITEST_BATCH_SIZE || 8);

function collectSpecFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSpecFiles(absolutePath));
      continue;
    }

    if (entry.isFile() && /\.(spec)\.(ts|tsx)$/.test(entry.name)) {
      files.push(path.relative(projectRoot, absolutePath));
    }
  }

  return files;
}

function chunk(list, size) {
  const chunks = [];

  for (let index = 0; index < list.length; index += size) {
    chunks.push(list.slice(index, index + size));
  }

  return chunks;
}

const specFiles = collectSpecFiles(srcRoot).sort();
const batches = chunk(specFiles, batchSize);

if (specFiles.length === 0) {
  console.error('No Vitest spec files were found.');
  process.exit(1);
}

for (const [index, batch] of batches.entries()) {
  console.log(`\nRunning Vitest batch ${index + 1}/${batches.length}`);

  const result = spawnSync(
    process.execPath,
    [
      vitestEntrypoint,
      'run',
      '--minWorkers=1',
      '--maxWorkers=1',
      ...batch,
    ],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        CI: 'true',
        NODE_OPTIONS: '--max-old-space-size=4096',
      },
      stdio: 'inherit',
    }
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
