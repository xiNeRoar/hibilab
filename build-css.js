'use strict';

const {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { spawnSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');
const { buildPrototypeCss, scopeCompiledCss } = require('./scripts/prototype-css');

const root = __dirname;
const output = path.join(root, 'dist', 'css', 'hibi-lab.css');
const config = path.join(root, 'tailwind.config.js');
const cli = require.resolve('tailwindcss/lib/cli.js');
const verifyOnly = process.argv.includes('--verify-only');

async function main() {
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'hibilab-css-'));
  const temporaryInput = path.join(temporaryDirectory, 'hibi-lab.input.css');
  const temporaryOutput = path.join(temporaryDirectory, 'hibi-lab.css');

  try {
    const tailwindSource = readFileSync(path.join(root, 'src', 'tailwind.css'), 'utf8');
    const prototypeCss = await buildPrototypeCss(root);
    writeFileSync(temporaryInput, `${tailwindSource.trimEnd()}\n\n${prototypeCss}\n`, 'utf8');

    const result = spawnSync(
      process.execPath,
      [cli, '--config', config, '--input', temporaryInput, '--output', temporaryOutput, '--minify'],
      {
        cwd: root,
        // Tailwind 3's bundled peer contains its own frozen Browserslist data and
        // cannot consume a separately updated caniuse-lite lockfile. Browser
        // support is pinned and tested by the release matrix in the Handoff.
        env: {
          ...process.env,
          NODE_ENV: 'production',
          BROWSERSLIST_IGNORE_OLD_DATA: 'true',
        },
        stdio: 'inherit',
      },
    );

    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(`Tailwind CSS build exited with status ${result.status || 1}.`);
    }

    // Tailwind's selector-based `important` strategy scopes utilities, but its
    // internal variable initializer is still global. Apply a final deterministic
    // scope pass so every non-keyframe rule is contained by the HIBI LAB roots.
    const compiledCss = readFileSync(temporaryOutput, 'utf8');
    writeFileSync(temporaryOutput, await scopeCompiledCss(compiledCss), 'utf8');

    if (verifyOnly) {
      if (!existsSync(output)) {
        throw new Error(`Missing built CSS: ${path.relative(root, output)}`);
      }

      const expected = readFileSync(temporaryOutput);
      const actual = readFileSync(output);
      if (!actual.equals(expected)) {
        throw new Error('Built CSS is stale. Run npm run build:css.');
      }

      console.log(`Verified fresh ${path.relative(root, output)}`);
      return;
    }

    mkdirSync(path.dirname(output), { recursive: true });
    copyFileSync(temporaryOutput, output);
    console.log(`Built ${path.relative(root, output)}`);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
