'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const postcss = require('postcss');
const prefixSelector = require('postcss-prefix-selector');
const productionArtifacts = require('./production-artifacts.json');

/*
 * The primary approved prototypes are the authored design source. State fixtures
 * (`_p*.html`) stay out unless a source entry explicitly selects a globally shared,
 * namespaced component (currently the approved cross-site consent banner). This
 * prevents specimen-page chrome from becoming a second CSS source of truth. Email
 * CSS stays inline, as required by mail-client rendering. The generated theme bundle
 * is scoped so it cannot restyle the parent Scent.M site or WooCommerce admin screens;
 * only allowlisted `.scentm-consent-*` selectors remain global.
 */
const PROTOTYPE_SOURCES = productionArtifacts.authoredCssSources;

function extractStyleBlocks(html, file) {
  const blocks = [...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)]
    .map((match) => match[1]);

  if (blocks.length === 0) {
    throw new Error(`No authored style blocks found in ${file}.`);
  }

  return blocks;
}

function extractJavaScriptHtmlString(source, file) {
  const match = source.match(/host\.innerHTML=("(?:\\.|[^"\\])*")/);
  if (!match) {
    throw new Error(`Could not find the storefront HTML string in ${file}.`);
  }

  try {
    return JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`Could not decode the storefront HTML string in ${file}: ${error.message}`);
  }
}

function selectRules(css, selectors, sourceDescription) {
  if (!selectors) {
    return css;
  }

  const sourceRoot = postcss.parse(css, { from: sourceDescription });
  const selectedRoot = postcss.root();

  for (const selector of selectors) {
    const matches = [];
    sourceRoot.walkRules((rule) => {
      if (rule.selector.replace(/\s+/g, '') === selector.replace(/\s+/g, '')) {
        matches.push(rule.clone());
      }
    });

    if (matches.length !== 1) {
      throw new Error(
        `${sourceDescription} must contain exactly one authored rule for ${selector}; found ${matches.length}.`,
      );
    }
    selectedRoot.append(matches[0]);
  }

  return selectedRoot.toString();
}

function excludeRules(root, selectors, sourceDescription) {
  if (!selectors || selectors.length === 0) {
    return;
  }

  const normalizedSelectors = new Map(
    selectors.map((selector) => [selector.replace(/\s+/g, ''), { selector, count: 0 }]),
  );

  root.walkRules((rule) => {
    const ruleSelectors = rule.selectors || [];
    const retained = ruleSelectors.filter((selector) => {
      const exclusion = normalizedSelectors.get(selector.replace(/\s+/g, ''));
      if (!exclusion) {
        return true;
      }
      exclusion.count += 1;
      return false;
    });

    if (retained.length === 0) {
      rule.remove();
    } else if (retained.length !== ruleSelectors.length) {
      rule.selectors = retained;
    }
  });

  for (const { selector, count } of normalizedSelectors.values()) {
    if (count !== 1) {
      throw new Error(
        `${sourceDescription} must contain exactly one authored rule to exclude for ${selector}; found ${count}.`,
      );
    }
  }
}

function isInsideKeyframes(rule) {
  let parent = rule.parent;
  while (parent) {
    if (parent.type === 'atrule' && /^(?:-webkit-)?keyframes$/i.test(parent.name)) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

function scopeSelector(selector, page, global = false) {
  if (global) {
    return selector;
  }

  const pageClass = page ? `.hibilab-page-${page}` : '';
  const htmlScope = `html.hibilab-root${pageClass}`;
  const bodyScope = `body.hibilab-surface${pageClass}`;

  if (/^:root\b/.test(selector)) {
    return selector.replace(/^:root\b/, htmlScope);
  }
  if (/^html\b/.test(selector)) {
    return selector.replace(/^html\b/, htmlScope);
  }
  if (/^body\b/.test(selector)) {
    return selector.replace(/^body\b/, bodyScope);
  }

  return `${bodyScope} ${selector}`;
}

function namespaceKeyframes(root, sourceId) {
  const names = new Map();

  root.walkAtRules(/^(?:-webkit-)?keyframes$/i, (atRule) => {
    const original = atRule.params.trim();
    const namespaced = `hibilab-${sourceId}-${original}`;
    names.set(original, namespaced);
    atRule.params = namespaced;
  });

  if (names.size === 0) {
    return;
  }

  root.walkDecls(/^(?:-webkit-)?animation(?:-name)?$/, (declaration) => {
    for (const [original, namespaced] of names) {
      declaration.value = declaration.value.replace(
        new RegExp(`(^|[^\\w-])${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\w-])`, 'g'),
        `$1${namespaced}$2`,
      );
    }
  });
}

async function buildSourceCss(rootDirectory, source) {
  const filePath = path.join(rootDirectory, source.file);
  const authoredSource = await fs.readFile(filePath, 'utf8');
  const html = source.sourceType === 'javascript-html-string'
    ? extractJavaScriptHtmlString(authoredSource, source.file)
    : authoredSource;
  const blocks = extractStyleBlocks(html, source.file);
  const selectedBlocks = source.blocks.map((blockIndex) => {
    if (!blocks[blockIndex]) {
      throw new Error(`${source.file} is missing authored style block ${blockIndex}.`);
    }
    return selectRules(
      blocks[blockIndex],
      source.selectors,
      `${source.file}#style-${blockIndex}`,
    );
  });

  const parsed = postcss.parse(selectedBlocks.join('\n'), { from: source.file });
  excludeRules(parsed, source.excludeSelectors, source.file);
  namespaceKeyframes(parsed, source.id);

  const result = await postcss([
    prefixSelector({
      prefix: 'body.hibilab-surface',
      transform(prefix, selector, prefixedSelector, filePathArgument, rule) {
        if (isInsideKeyframes(rule)) {
          return selector;
        }
        return scopeSelector(selector, source.page, source.global);
      },
    }),
  ]).process(parsed, { from: source.file });

  return result.css;
}

async function buildPrototypeCss(rootDirectory) {
  const sections = [];
  for (const source of PROTOTYPE_SOURCES) {
    sections.push(await buildSourceCss(rootDirectory, source));
  }

  return [
    '/*! HIBI LAB authored prototype CSS; generated deterministically by scripts/prototype-css.js. */',
    ...sections,
  ].join('\n');
}

async function scopeCompiledCss(css) {
  const result = await postcss([
    prefixSelector({
      prefix: 'body.hibilab-surface',
      transform(prefix, selector, prefixedSelector, filePathArgument, rule) {
        if (
          isInsideKeyframes(rule)
          || selector.startsWith('body.hibilab-surface')
          || selector.startsWith('html.hibilab-root')
          || selector.startsWith('.scentm-consent-')
        ) {
          return selector;
        }
        return scopeSelector(selector);
      },
    }),
  ]).process(css, { from: undefined });

  return result.css;
}

module.exports = {
  PROTOTYPE_SOURCES,
  buildPrototypeCss,
  scopeCompiledCss,
};
