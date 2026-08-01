'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const postcss = require('postcss');
const productionArtifacts = require('./production-artifacts.json');

const root = path.resolve(__dirname, '..');
const cssPath = path.join(root, 'dist', 'css', 'hibi-lab.css');

async function main() {
  const cssFreshness = spawnSync(
    process.execPath,
    [path.join(root, 'build-css.js'), '--verify-only'],
    { cwd: root, stdio: 'inherit' },
  );

  if (cssFreshness.error) {
    throw cssFreshness.error;
  }
  if (cssFreshness.status !== 0) {
    process.exit(cssFreshness.status || 1);
  }

  const css = await fs.readFile(cssPath, 'utf8');
  if (css.length < 1000) {
    throw new Error('Built CSS is unexpectedly small.');
  }

  if (!css.includes('--tw-')) {
    throw new Error('Built CSS is missing Tailwind runtime variables.');
  }
  for (const forbiddenToken of productionArtifacts.cssContracts.forbiddenTokens) {
    if (css.includes(forbiddenToken)) {
      throw new Error(`Built CSS contains a host-theme-owned token: ${forbiddenToken}`);
    }
  }

  const parsedCss = postcss.parse(css);
  const selectors = new Set();
  const keyframes = new Set();
  parsedCss.walkAtRules(/^(?:-webkit-)?keyframes$/i, (atRule) => {
    keyframes.add(atRule.params.trim());
  });
  parsedCss.walkRules((rule) => {
    let parent = rule.parent;
    while (parent) {
      if (parent.type === 'atrule' && /^(?:-webkit-)?keyframes$/i.test(parent.name)) {
        return;
      }
      parent = parent.parent;
    }

    for (const selector of rule.selectors || []) {
      selectors.add(selector);
      for (const forbiddenFragment of productionArtifacts.cssContracts.forbiddenSelectorFragments) {
        if (selector.includes(forbiddenFragment)) {
          throw new Error(`Built CSS contains a forbidden selector: ${selector}`);
        }
      }
      if (
        !selector.startsWith('body.hibilab-surface')
        && !selector.startsWith('html.hibilab-root')
        && !selector.startsWith('.scentm-consent-')
      ) {
        throw new Error(`Built CSS contains an unscoped selector: ${selector}`);
      }
    }
  });

  for (const requiredSelector of productionArtifacts.cssContracts.requiredSelectors) {
    if (!selectors.has(requiredSelector)) {
      throw new Error(`Built CSS is missing required selector: ${requiredSelector}`);
    }
  }
  for (const requiredKeyframes of productionArtifacts.cssContracts.requiredKeyframes) {
    if (!keyframes.has(requiredKeyframes)) {
      throw new Error(`Built CSS is missing required keyframes: ${requiredKeyframes}`);
    }
  }

  const imageVerification = spawnSync(
    process.execPath,
    [path.join(root, 'scripts', 'build-images.js'), '--verify-only'],
    { cwd: root, stdio: 'inherit' },
  );

  if (imageVerification.error) {
    throw imageVerification.error;
  }
  if (imageVerification.status !== 0) {
    process.exit(imageVerification.status || 1);
  }

  console.log('Verified CSS and image build outputs.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
