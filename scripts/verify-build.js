'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const postcss = require('postcss');

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

  const expectedTokens = [
    '--tw-',
    'body.hibilab-surface .text-brand-brown',
    'body.hibilab-surface .bg-brand-terracotta',
    'body.hibilab-surface #main-header',
    'body.hibilab-surface .hb-qty',
    'body.hibilab-surface.hibilab-page-landing .fp-card',
    'body.hibilab-surface.hibilab-page-shop .cat-pill',
    'body.hibilab-surface.hibilab-page-product .pdp-thumb',
    'body.hibilab-surface.hibilab-page-cart .qty-btn',
    'body.hibilab-surface.hibilab-page-checkout .co-field label',
    'body.hibilab-surface.hibilab-page-account .acct-nav-link',
    'body.hibilab-surface.hibilab-page-account-login .auth-tab',
    'body.hibilab-surface.hibilab-page-tier-cards .tier-note',
    '.scentm-consent-banner',
    '.scentm-consent-accept',
    '.scentm-consent-decline',
    '@keyframes hibilab-checkout-payspin',
  ];

  for (const expectedToken of expectedTokens) {
    if (!css.includes(expectedToken)) {
      throw new Error(`Built CSS is missing expected token: ${expectedToken}`);
    }
  }

  const forbiddenTokens = [
    'body.hibilab-surface .hibi-mark',
    'hibi-lab-logo.png',
  ];
  for (const forbiddenToken of forbiddenTokens) {
    if (css.includes(forbiddenToken)) {
      throw new Error(`Built CSS contains a host-theme-owned token: ${forbiddenToken}`);
    }
  }

  const parsedCss = postcss.parse(css);
  parsedCss.walkRules((rule) => {
    let parent = rule.parent;
    while (parent) {
      if (parent.type === 'atrule' && /^(?:-webkit-)?keyframes$/i.test(parent.name)) {
        return;
      }
      parent = parent.parent;
    }

    for (const selector of rule.selectors || []) {
      if (
        !selector.startsWith('body.hibilab-surface')
        && !selector.startsWith('html.hibilab-root')
        && !selector.startsWith('.scentm-consent-')
      ) {
        throw new Error(`Built CSS contains an unscoped selector: ${selector}`);
      }
    }
  });

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
