'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);
const ARTIFACT_INVENTORY = Object.freeze({
  html: Object.freeze([
    '_p01-states-book.html',
    '_p13-shop-emptycat.html',
    '_p14-pdp-guest.html',
    '_p15-pdp-soldout.html',
    '_p16-pdp-early-guest.html',
    '_p17-pdp-early-under.html',
    '_p18-shop-guest.html',
    '_p19b-checkout-guest.html',
    '_p19-cart-guest.html',
    '_p20-cart-birthday.html',
    '_p21-checkout-below-threshold.html',
    '_p22-orderreceived-guest.html',
    '_p23-orderreceived-failed.html',
    '_p24-email-variants.html',
    '_p25-account-states.html',
    '_p26-slidecart-search-states.html',
    '_p27-pdp-preorder.html',
    '_p28-preorder-states.html',
    '_p29-orderreceived-payment-states.html',
    '_p30-cookie-banner.html',
    'HIBI LAB 404.html',
    'HIBI LAB Account Login.html',
    'HIBI LAB Account.html',
    'HIBI LAB Cart.html',
    'HIBI LAB Checkout.html',
    'HIBI LAB Email.html',
    'HIBI LAB Landing.html',
    'HIBI LAB Order Received.html',
    'HIBI LAB Product.html',
    'HIBI LAB Shipping.html',
    'HIBI LAB Shop.html',
    'HIBI LAB Tier Cards.html',
    'index.html',
    'scentm-home.html',
  ]),
  stateScreenshots: Object.freeze([
    'states-img/01-landing.jpg',
    'states-img/02-shop-member-all.jpg',
    'states-img/03-shop-filter-empty.jpg',
    'states-img/04-shop-search-empty.jpg',
    'states-img/05-shop-empty-category.jpg',
    'states-img/06-shop-guest.jpg',
    'states-img/07-shipping-policy.jpg',
    'states-img/08-404.jpg',
    'states-img/09-pdp-member.jpg',
    'states-img/10-pdp-variant-200ml.jpg',
    'states-img/11-pdp-guest.jpg',
    'states-img/12-pdp-soldout.jpg',
    'states-img/13-pdp-early-guest.jpg',
    'states-img/14-pdp-early-under.jpg',
    'states-img/15-cart-member.jpg',
    'states-img/16-cart-coupon-rejected.jpg',
    'states-img/17-cart-coupon-applied.jpg',
    'states-img/18-cart-empty.jpg',
    'states-img/19-cart-guest.jpg',
    'states-img/20-cart-birthday.jpg',
    'states-img/21-checkout-member.jpg',
    'states-img/22-checkout-pickup-picker.jpg',
    'states-img/23-checkout-declined.jpg',
    'states-img/24-checkout-guest.jpg',
    'states-img/25-checkout-below-threshold.jpg',
    'states-img/26-orderreceived-member.jpg',
    'states-img/27-orderreceived-guest.jpg',
    'states-img/28-orderreceived-failed.jpg',
    'states-img/29-account-overview.jpg',
    'states-img/30-account-orders-5states.jpg',
    'states-img/31-account-address.jpg',
    'states-img/32-account-settings.jpg',
    'states-img/33-login.jpg',
    'states-img/34-register.jpg',
    'states-img/35-forgot-neutral.jpg',
    'states-img/36-reset.jpg',
    'states-img/37-tiercards.jpg',
    'states-img/38-account-states.jpg',
    'states-img/39-email-main.jpg',
    'states-img/40-email-variants.jpg',
    'states-img/41-drawer-member.jpg',
    'states-img/42-drawer-empty.jpg',
    'states-img/43-search-results.jpg',
    'states-img/44-search-noresults.jpg',
    'states-img/45-chrome-states.jpg',
    'states-img/46-pdp-preorder.jpg',
    'states-img/47-preorder-states.jpg',
    'states-img/49-account-repurchase.jpg',
    'states-img/50-cookie-banner.jpg',
  ]),
  sourceImages: Object.freeze([
    'by-scentm.png',
    'cat-home.png',
    'cat-pet.png',
    'cat-skincare.png',
    'cat-sleep.png',
    'hero.jpg',
    'hero-product.png',
    'hibi-lab-logo.png',
    'journal-1.jpg',
    'journal-2.jpg',
    'journal-3.jpg',
    'marketing.jpg',
    'odm-perfume.jpg',
    'prod-cleanser.png',
    'prod-diffuser.png',
    'prod-essencewater.png',
    'prod-petmist.png',
    'prod-q10.png',
    'prod-sleepmist.png',
    'promise-candle.png',
    'scentm-logo.png',
  ]),
  support: Object.freeze([
    '.gitattributes',
    '.gitignore',
    'HIBI LAB - WP Handoff.md',
    'assets/image-build-manifest.json',
    'build-css.js',
    'package-lock.json',
    'package.json',
    'scripts/build-images.js',
    'scripts/prototype-css.js',
    'scripts/verify-build.js',
    'scripts/verify-prototypes.js',
    'src/tailwind.css',
    'store-chrome.js',
    'tailwind.config.js',
  ]),
});

const expectedArtifacts = Object.freeze(Object.values(ARTIFACT_INVENTORY).flat());
const contractTextExtensions = new Set(['.css', '.html', '.js', '.json', '.md']);

// These links belong to the existing Scent.M theme, not this HIBI prototype repo.
const externalPrototypePages = new Set([
  'about.html',
  'contact.html',
  'journal.html',
  'odm-home.html',
  'odm-perfume.html',
  'odm-personal.html',
  'odm-pet.html',
  'privacy.html',
  'terms.html',
  'testimonials.html',
  'workshops.html',
]);

const canonicalEmailPlaceholders = [
  '{name}', '{customer_email}', '{customer_phone}', '{order}', '{date}',
  '{items}', '{subtotal}', '{discount_rows}', '{shipping}',
  '{shipping_method}', '{fee_rows}', '{tax_rows}', '{refund_amount}',
  '{refunded_total}', '{total}', '{address}', '{tracking_no}',
  '{tracking_url}', '{carrier}', '{order_url}', '{status_note}', '{product}',
  '{schedule}', '{reorder_url}', '{manage_reminders_url}', '{unsubscribe_url}',
];

const pdpPrototypeFiles = [
  'HIBI LAB Product.html',
  '_p14-pdp-guest.html',
  '_p15-pdp-soldout.html',
  '_p16-pdp-early-guest.html',
  '_p17-pdp-early-under.html',
  '_p27-pdp-preorder.html',
];

const checkoutPrototypeFiles = [
  'HIBI LAB Checkout.html',
  '_p19b-checkout-guest.html',
  '_p21-checkout-below-threshold.html',
];

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolute));
    } else {
      files.push(absolute);
    }
  }
  return files;
}

function fail(message) {
  throw new Error(message);
}

function relative(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function markdownSection(markdown, heading) {
  const starts = [...markdown.matchAll(new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gm'))];
  if (starts.length !== 1) {
    fail(`Handoff must contain exactly one ${heading} section; found ${starts.length}.`);
  }
  const start = starts[0].index;
  const next = markdown.indexOf('\n## ', start + heading.length);
  return markdown.slice(start, next < 0 ? markdown.length : next);
}

function htmlComments(html) {
  return [...html.matchAll(/<!--[\s\S]*?-->/g)].map((match) => match[0]);
}

function sourceComments(source) {
  return [...source.matchAll(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|^[\t ]*\/\/[^\r\n]*/gm)]
    .map((match) => match[0]);
}

function elementById(html, tagName, id) {
  const pattern = new RegExp(
    `<${tagName}\\b(?=[^>]*\\bid=["']${id}["'])[^>]*>[\\s\\S]*?<\\/${tagName}>`,
    'i',
  );
  return html.match(pattern)?.[0] || '';
}

function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function paymentActionLabels(html) {
  return [...html.matchAll(/<(a|button)\b[^>]*>[\s\S]*?<\/\1>/gi)]
    .map((match) => visibleText(match[0]))
    .filter((label) => /^(?:繼續|重新|完成)付款$/.test(label));
}

function inputNames(html, type) {
  return [...html.matchAll(/<input\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((input) => !type || new RegExp(`\\btype=["']${type}["']`, 'i').test(input))
    .map((input) => input.match(/\bname=["']([^"']+)["']/i)?.[1] || '');
}

function formControlNames(html) {
  return [...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/gi)]
    .map((match) => match[0].match(/\bname=["']([^"']+)["']/i)?.[1] || '')
    .filter(Boolean);
}

function requireText(source, required, context) {
  for (const text of required) {
    if (!source.includes(text)) {
      fail(`${context} is missing approved contract text: ${text}`);
    }
  }
}

function hasExactCase(targetFile) {
  const relativeTarget = path.relative(root, targetFile);
  if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
    return false;
  }

  let current = root;
  for (const segment of relativeTarget.split(path.sep).filter(Boolean)) {
    if (!fs.readdirSync(current).includes(segment)) {
      return false;
    }
    current = path.join(current, segment);
  }
  return true;
}

function verifyArtifactInventory(files) {
  const duplicates = expectedArtifacts.filter(
    (artifact, index) => expectedArtifacts.indexOf(artifact) !== index,
  );
  if (duplicates.length) {
    fail(`Artifact inventory contains duplicate path(s): ${[...new Set(duplicates)].join(', ')}`);
  }
  if (expectedArtifacts.length !== 118) {
    fail(`Artifact inventory must contain exactly 118 files; found ${expectedArtifacts.length}.`);
  }

  const actual = files.map(relative).sort();
  const expected = [...expectedArtifacts].sort();
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = expected.filter((artifact) => !actualSet.has(artifact));
  const unexpected = actual.filter((artifact) => !expectedSet.has(artifact));
  if (missing.length || unexpected.length) {
    fail([
      'Repository artifact inventory has drifted.',
      missing.length ? `Missing: ${missing.join(', ')}` : '',
      unexpected.length ? `Unexpected: ${unexpected.join(', ')}` : '',
    ].filter(Boolean).join(' '));
  }
}

function verifyContractTextFiles(files) {
  for (const file of files) {
    const name = path.basename(file);
    if (!contractTextExtensions.has(path.extname(file)) && name !== '.gitattributes' && name !== '.gitignore') {
      continue;
    }
    const source = fs.readFileSync(file, 'utf8');
    if (source.includes('\r')) {
      fail(`${relative(file)} contains a CR line ending; contract text must use LF.`);
    }
    if (source && !source.endsWith('\n')) {
      fail(`${relative(file)} is missing its final newline.`);
    }
  }
}

function verifyCanonicalPricingContract(handoff, htmlByPath) {
  const section = markdownSection(handoff, '## 6.');
  const definitionMarkers = section.match(/\*\*vs會員價＝二選一取最抵（[^）\n]*全單口徑[^）\n]*）\*\*/g) || [];
  if (definitionMarkers.length !== 1 || section.split('canonical quote service').length - 1 !== 1) {
    fail('Handoff must have exactly one canonical member-price/coupon quote definition in §6.');
  }
  requireText(section, [
    definitionMarkers[0],
    'canonical quote service',
    'member path',
    'coupon path',
    'd = max(tier_discount, birthday_discount)',
    'quantize(regular_price × (1 − d / 100))',
    'Woo官方discount APIs',
    '商品應付subtotal',
    '每次cart recalc及Checkout submit都server-side重跑',
  ], 'Handoff §6 canonical pricing definition');
  if (!/coupon path.{0,320}嚴格(?:低過|較低於?)member path.{0,80}(?:先勝出|先贏)/is.test(section)
      || !/平手(?:回|採用|用)member path/i.test(section)) {
    fail('Handoff §6 must preserve the coupon-strictly-lower / tie-to-member winner predicate.');
  }

  const outsideSection = handoff.replace(section, '');
  for (const line of outsideSection.split('\n').filter((candidate) => candidate.includes('canonical quote service'))) {
    if (!line.includes('§6') || /(?:member path|coupon path)\s*=|final payable merchandise subtotal/i.test(line)) {
      fail('A non-§6 implementation note redefines the canonical member-price/coupon quote instead of referencing §6.');
    }
  }

  for (const [file, html] of htmlByPath) {
    for (const comment of sourceComments(html)) {
      if (/(?:二選一取最抵|best-wins)/i.test(comment) && !comment.includes('§6')) {
        fail(`${relative(file)} contains a pricing-decision comment that does not reference canonical Handoff §6.`);
      }
    }
  }
}

function verifyPdpSlaContract(htmlByPath) {
  for (const fileName of pdpPrototypeFiles) {
    const html = htmlByPath.get(path.join(root, fileName));
    const comments = htmlComments(html).filter((comment) => /SLA|送達日數/i.test(comment));
    if (!comments.length) {
      fail(`${fileName} is missing its non-visual PDP delivery-SLA contract marker.`);
    }
    if (comments.some((comment) => /(?:SLA|送達日數).{0,220}(?:Checkout|Order\s*Received|\/OR)|(?:Checkout|Order\s*Received).{0,220}(?:SLA|送達日數)/is.test(comment))) {
      fail(`${fileName} still claims that delivery SLA appears in Checkout or Order Received.`);
    }
    if (!comments.some((comment) => /SLA.{0,120}(?:只|僅)(?:由|喺)?.{0,60}(?:Shipping Policy|送貨政策頁)|SLA\s*=\s*(?:Shipping Policy|(?:送貨)?政策頁)/is.test(comment))) {
      fail(`${fileName} must state that customer-facing delivery SLA lives only on the Shipping Policy page.`);
    }
  }
}

function verifyPaymentStatePrototypes(htmlByPath, handoff) {
  const success = htmlByPath.get(path.join(root, 'HIBI LAB Order Received.html'));
  const failed = htmlByPath.get(path.join(root, '_p23-orderreceived-failed.html'));
  const neutral = htmlByPath.get(path.join(root, '_p29-orderreceived-payment-states.html'));
  const stateBook = htmlByPath.get(path.join(root, '_p01-states-book.html'));
  const pending = elementById(neutral, 'section', 'state-pending');
  const unknown = elementById(neutral, 'section', 'state-unknown');
  const unpaid = elementById(neutral, 'section', 'state-unpaid');

  if (!pending || !unknown || !unpaid) {
    fail('The payment-state review prototype must expose pending, unknown and unpaid tabpanels.');
  }
  if (/id=["'](?:tab|state)-onhold["']/i.test(neutral)) {
    fail('Raw Woo on-hold must not be exposed as a separate customer-facing payment state.');
  }
  if (!/role=["']tabpanel["']/i.test(pending) || !/aria-labelledby=["']tab-pending["']/i.test(pending)) {
    fail('The pending-payment review panel has lost its tabpanel relationship.');
  }
  for (const [state, panel] of [['unknown', unknown], ['unpaid', unpaid]]) {
    const tabId = `tab-${state}`;
    if (!/role=["']tabpanel["']/i.test(panel)
        || !new RegExp(`aria-labelledby=["']${tabId}["']`, 'i').test(panel)
        || !/\shidden(?:\s|>)/i.test(panel)) {
      fail(`The ${state} payment review panel has lost its hidden tabpanel relationship.`);
    }
  }

  requireText(visibleText(success), [
    '訂單完成 · Order confirmed',
    '多謝你落單。',
    '我哋已收到你嘅訂單。確認電郵會寄到你填寫嘅電郵地址；出貨後，我哋會再通知你並附上追蹤資料。',
  ], 'Confirmed-payment Order Received prototype');
  requireText(visibleText(failed), [
    '付款未成功 · Payment failed',
    '付款未能完成。',
    '你嘅訂單已建立，但付款未成功，未有扣款。你可以重試付款，或改用其他付款方式。',
    '重新付款',
  ], 'Failed-payment Order Received prototype');
  requireText(failed, [
    'PaymentEvidenceService=unpaid',
    '冇 success／in-flight evidence',
    'Woo order仍payable',
    'hold／claim仍有效',
    '全部server gates通過',
    '只resume同一張order',
    'raw Woo failed／pending／on-hold不可顯示 Pay CTA',
    'accepted_claim_generation',
    'provider unknown 應顯示核對中',
    'WC order-pay endpoint 重付同一張單',
  ], 'Failed-payment implementation markers');
  requireText(visibleText(pending), [
    '付款處理中 · Payment processing',
    '付款正在處理',
    '付款仍在處理中，請勿重新付款。訂單狀態會在付款結果確認後自動更新。',
    '你可以稍後重新整理頁面，或者前往會員中心查看最新狀態。',
  ], 'Pending-payment review panel');
  requireText(pending, [
    'PaymentEvidenceService=pending',
    'in-flight',
    '絕不顯示 Pay／Retry action',
  ], 'Pending-payment implementation marker');
  requireText(visibleText(unknown), [
    '狀態確認中 · Status review',
    '付款狀態確認中',
    '付款狀態確認中，請勿重新付款。我哋確認後會更新訂單狀態。',
  ], 'Unknown-payment review panel');
  requireText(visibleText(unpaid), [
    '尚未付款 · Unpaid',
    '此訂單尚未付款',
    '如果訂單仍可付款，你可以使用下方按鈕繼續。',
    '付款完成後，訂單狀態會自動更新。',
    '繼續付款',
  ], 'Unpaid-payment review panel');

  for (const [state, panel] of [['pending', pending], ['unknown', unknown]]) {
    if (paymentActionLabels(panel).length) {
      fail(`The ${state} payment review panel must not expose a payment action.`);
    }
  }
  const unpaidActions = paymentActionLabels(unpaid);
  if (unpaidActions.length !== 1 || unpaidActions[0] !== '繼續付款') {
    fail('The unpaid review panel must expose exactly one approved conditional payment action.');
  }
  requireText(unpaid, [
    'PaymentEvidenceService=unpaid',
    '冇 success／in-flight evidence',
    'Woo order仍payable',
    'hold／claim仍有效',
    '全部server gates通過',
    '只resume同一張order',
  ], 'Unpaid-payment implementation marker');
  if (/訂單完成|Order confirmed|多謝你落單/.test(`${visibleText(pending)} ${visibleText(unknown)} ${visibleText(unpaid)}`)) {
    fail('A neutral payment-state panel contains confirmed-payment success copy.');
  }
  const paymentContract = markdownSection(handoff, '## 5.');
  requireText(paymentContract, [
    '`provider_in_flight`',
    '付款處理中 · Payment processing',
    '付款正在處理',
    '付款仍在處理中，請勿重新付款。訂單狀態會在付款結果確認後自動更新。',
    '無 Pay CTA',
    '`confirmation_projection_due`',
    '`confirmation_ambiguous`',
    '付款狀態確認中，請勿重新付款。我哋確認後會更新訂單狀態。',
    'canonical evidence證實冇成功亦冇in-flight付款',
    'Woo訂單仍payable、hold／claim仍有效及全部server gates通過',
    'Pay CTA只resume同一張order',
  ], 'Handoff semantic payment-state matrix');
  requireText(handoff, [
    '即使raw Woo `pending`／`needs_payment()`為真亦零Pay CTA',
    'Raw Woo `pending|on-hold|failed`不可自行揀畫面或action',
    '`PaymentEvidenceService=unpaid` review helper：只喺§5全部canonical Pay gates通過',
    'raw Woo `failed|pending|on-hold`本身不可顯示CTA',
  ], 'Handoff raw-Woo payment-state prohibition');
  const rawWooPaymentLines = handoff.split('\n').filter(
    (line) => /(?:raw Woo|Woo raw)/i.test(line)
      && /(?:pending|on-hold|needs_payment)/i.test(line)
      && /(?:Pay CTA|支付\s*action|重新付款|重付)/i.test(line),
  );
  if (!rawWooPaymentLines.length
      || rawWooPaymentLines.some((line) => !/(?:零|無|唔|不|絕不|不可|唯有|only)/i.test(line))) {
    fail('Handoff must explicitly forbid raw Woo pending/on-hold/needs_payment from authorizing a Pay action.');
  }
  requireText(stateBook, [
    '<span class="num">28-A</span>',
    'data-link="_p29-orderreceived-payment-states.html"',
    'PaymentEvidenceService=pending／unknown＝中性狀態',
    'raw Woo on-hold 先由 PaymentEvidenceService 歸一為 pending／unknown，唔另開客面狀態或 Pay CTA',
    '只有 service=unpaid 且仍可安全續付先可 resume 同一張訂單',
  ], 'State-book payment-state entry');
}

function verifyCustomerDataMapping(handoff, htmlByPath) {
  const mappingLines = handoff.split('\n').filter((line) => line.includes('Checkout資料對照（2026-07-29客戶裁決2A'));
  if (mappingLines.length !== 1) {
    fail(`Handoff must contain exactly one approved Checkout-data mapping block; found ${mappingLines.length}.`);
  }
  const mapping = mappingLines[0];
  requireText(mapping, [
    '2026-07-29客戶裁決2A',
    '`shipping_first_name`',
    '`billing_first_name`',
    '`billing_email`',
    '`billing_phone`',
    '`shipping_state`',
    '`shipping_address_1`',
    'Returning customer預填先讀已保存shipping fields',
    'fallback同名billing address欄',
    'Account維持現稿兩張卡',
    'Billing Address',
    'Shipping Address',
  ], 'Handoff Checkout/Account customer-data mapping');
  if (!/單一「名字」(?:→|＝|使用)\s*`shipping_first_name`/i.test(mapping)
      || !/(?:`shipping_first_name`.{0,160}(?:複製|copy).{0,80}`billing_first_name`|`billing_first_name`.{0,160}(?:由|copy from).{0,80}`shipping_first_name`)/is.test(mapping)) {
    fail('Handoff must map the single visible Checkout name to shipping_first_name and copy its validated value to billing_first_name server-side.');
  }
  if (!/(?:唯一持久datum|canonical)\s*[^。\n]{0,80}`billing_phone`|`billing_phone`[^。\n]{0,80}(?:唯一持久datum|canonical)/is.test(mapping)
      || !/(?:唔另存|不另存)[^。\n]{0,30}`shipping_phone`/is.test(mapping)) {
    fail('Handoff must keep billing_phone as the only persistent phone datum and explicitly reject shipping_phone.');
  }
  if (/單一「名字」(?:→|＝|使用)\s*`billing_first_name`/i.test(handoff)) {
    fail('Handoff still maps the single visible Checkout name directly to billing_first_name.');
  }

  for (const [file, html] of htmlByPath) {
    if (/\bname=["']shipping_phone["']/i.test(html)) {
      fail(`${relative(file)} creates a second shipping_phone datum; billing_phone is the approved canonical contact phone.`);
    }
  }

  for (const fileName of checkoutPrototypeFiles) {
    const html = htmlByPath.get(path.join(root, fileName));
    const phoneNames = inputNames(html, 'tel');
    if (phoneNames.length !== 1 || phoneNames[0] !== 'billing_phone') {
      fail(`${fileName} must expose exactly one tel field mapped to canonical billing_phone.`);
    }
    const controlNames = formControlNames(html);
    for (const field of ['billing_email', 'shipping_first_name', 'billing_phone', 'shipping_state', 'shipping_address_1']) {
      if (controlNames.filter((name) => name === field).length !== 1) {
        fail(`${fileName} must expose exactly one ${field} control for the approved Checkout mapping.`);
      }
    }
    for (const forbidden of ['billing_first_name', 'billing_state', 'billing_address_1', 'shipping_phone']) {
      if (controlNames.includes(forbidden)) {
        fail(`${fileName} exposes ${forbidden}, which conflicts with the approved visible Checkout mapping.`);
      }
    }
  }

  const account = htmlByPath.get(path.join(root, 'HIBI LAB Account.html'));
  const accountPhoneNames = inputNames(account, 'tel');
  if (accountPhoneNames.length !== 3 || accountPhoneNames.some((name) => name !== 'billing_phone')) {
    fail('Account billing, shipping and profile phone controls must all read/write the same canonical billing_phone datum.');
  }
  requireText(account, [
    'name="billing_first_name"',
    'name="billing_state"',
    'name="billing_address_1"',
    'name="shipping_first_name"',
    'name="shipping_state"',
    'name="shipping_address_1"',
  ], 'Account native WooCommerce address-field mapping');
  const accountControls = formControlNames(account);
  for (const field of [
    'billing_first_name', 'billing_state', 'billing_address_1',
    'shipping_first_name', 'shipping_state', 'shipping_address_1',
  ]) {
    if (accountControls.filter((name) => name === field).length !== 1) {
      fail(`Account must preserve exactly one native ${field} control across its Billing and Shipping Address cards.`);
    }
  }
}

function verifyStateBook(html) {
  const articles = [...html.matchAll(/<article\b[\s\S]*?<\/article>/gi)].map((match) => match[0]);
  if (articles.length !== 50) {
    fail(`State book must contain exactly 50 state articles; found ${articles.length}.`);
  }

  const numbers = [];
  const labels = [];
  const screenshots = [];
  let screenshotlessNumber = '';
  for (const article of articles) {
    const number = article.match(/<span\s+class="num">([\s\S]*?)<\/span>/i)?.[1].trim() || '';
    const label = article.match(/<h3>([\s\S]*?)<\/h3>/i)?.[1].replace(/<[^>]+>/g, '').trim() || '';
    const articleScreenshots = [...article.matchAll(/<img\b[^>]*\bsrc="(states-img\/[^"]+\.jpg)"/gi)]
      .map((match) => match[1]);
    if (!number || !label) {
      fail('Every state-book article must have a numbered label and an h3 title.');
    }
    if (articleScreenshots.length > 1) {
      fail(`State ${number} has more than one review screenshot.`);
    }
    if (articleScreenshots.length === 0) {
      if (screenshotlessNumber) {
        fail(`State book has more than one screenshotless state: ${screenshotlessNumber}, ${number}.`);
      }
      screenshotlessNumber = number;
    } else {
      screenshots.push(articleScreenshots[0]);
    }
    numbers.push(number);
    labels.push(label);
  }

  if (new Set(numbers).size !== 50 || new Set(labels).size !== 50) {
    fail('State-book numbers and titles must each be unique.');
  }
  if (screenshotlessNumber !== '28-A') {
    fail(`The only screenshotless review state must be 28-A; found ${screenshotlessNumber || 'none'}.`);
  }
  if (screenshots.length !== 49 || new Set(screenshots).size !== 49) {
    fail('State book must reference exactly 49 unique review screenshots.');
  }
  const expectedScreenshots = new Set(ARTIFACT_INVENTORY.stateScreenshots);
  const missing = ARTIFACT_INVENTORY.stateScreenshots.filter((file) => !screenshots.includes(file));
  const unexpected = screenshots.filter((file) => !expectedScreenshots.has(file));
  if (missing.length || unexpected.length) {
    fail(`State-book screenshot set has drifted. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`);
  }

  const hashes = ARTIFACT_INVENTORY.stateScreenshots.map((file) => (
    crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')
  ));
  if (new Set(hashes).size !== hashes.length) {
    fail('State screenshot files contain duplicate image content.');
  }
}

function decodeLocalPath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isExternalReference(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(value);
}

function idsIn(html) {
  return [...html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)].map((match) => match[2]);
}

function verifyReference(sourceFile, rawValue, htmlByPath) {
  const value = rawValue.trim();
  if (!value || value === '#' || /^\{[a-z_]+\}$/.test(value) || value.startsWith('data:') || isExternalReference(value)) {
    return;
  }

  const [rawTarget, rawFragment] = value.split('#', 2);
  const fragment = rawFragment ? decodeLocalPath(rawFragment) : '';
  let targetFile = sourceFile;

  if (rawTarget) {
    const cleanTarget = decodeLocalPath(rawTarget.split('?')[0]);
    if (externalPrototypePages.has(cleanTarget.replace(/^\.\//, ''))) {
      return;
    }
    targetFile = path.resolve(path.dirname(sourceFile), cleanTarget);
    if (!targetFile.startsWith(`${root}${path.sep}`) && targetFile !== root) {
      fail(`${relative(sourceFile)} links outside the repository: ${rawValue}`);
    }
    if (!fs.existsSync(targetFile)) {
      fail(`${relative(sourceFile)} has a missing local reference: ${rawValue}`);
    }
    if (!hasExactCase(targetFile)) {
      fail(`${relative(sourceFile)} has a local reference with incorrect path casing: ${rawValue}`);
    }
  }

  if (fragment) {
    const targetHtml = htmlByPath.get(targetFile);
    if (targetHtml && !new Set(idsIn(targetHtml)).has(fragment)) {
      fail(`${relative(sourceFile)} links to missing fragment #${fragment} in ${relative(targetFile)}`);
    }
  }
}

function verifyHtml(file, html, htmlByPath) {
  const ids = idsIn(html);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) {
    fail(`${relative(file)} contains duplicate id(s): ${[...new Set(duplicates)].join(', ')}`);
  }

  for (const match of html.matchAll(/\b(?:href|src|data-link)\s*=\s*(["'])(.*?)\1/gi)) {
    verifyReference(file, match[2], htmlByPath);
  }
  for (const match of html.matchAll(/\bsrcset\s*=\s*(["'])(.*?)\1/gi)) {
    for (const candidate of match[2].split(',')) {
      verifyReference(file, candidate.trim().split(/\s+/)[0], htmlByPath);
    }
  }

  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = match[1];
    const source = match[2].trim();
    if (/\bsrc\s*=/i.test(attributes) || !source) {
      continue;
    }
    if (/\btype\s*=\s*(["'])application\/ld\+json\1/i.test(attributes)) {
      try {
        JSON.parse(source);
      } catch (error) {
        fail(`${relative(file)} contains invalid JSON-LD: ${error.message}`);
      }
      continue;
    }
    try {
      new vm.Script(source, { filename: relative(file) });
    } catch (error) {
      fail(`${relative(file)} contains invalid inline JavaScript: ${error.message}`);
    }
  }

  const idSet = new Set(ids);
  for (const match of html.matchAll(/\b(?:aria-controls|aria-describedby|aria-labelledby|for)\s*=\s*(["'])(.*?)\1/gi)) {
    for (const id of match[2].trim().split(/\s+/)) {
      if (id && !idSet.has(id)) {
        fail(`${relative(file)} references missing id ${id}`);
      }
    }
  }

  if (path.basename(file) !== 'scentm-home.html' && /(?<!HK)\$\d/.test(html)) {
    fail(`${relative(file)} contains a non-HKD numeric money literal.`);
  }
  for (const match of html.matchAll(/HK\$\s*\d[\d,]*(?:\.\d+)?/g)) {
    const literal = match[0].replace(/\s+/g, '');
    if (!/^HK\$(?:\d+|\d{1,3}(?:,\d{3})+)\.\d{2}$/.test(literal)) {
      fail(`${relative(file)} contains a money literal without exactly two decimals: ${match[0]}`);
    }
  }
  if (/\bPDPA\b|durable command/i.test(html)) {
    fail(`${relative(file)} contains a stale implementation term.`);
  }
}

function verifyJavaScript(file) {
  const source = fs.readFileSync(file, 'utf8');
  try {
    new vm.Script(source, { filename: relative(file) });
  } catch (error) {
    fail(`${relative(file)} contains invalid JavaScript: ${error.message}`);
  }
}

function styleBlocks(html) {
  return [...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map((match) => match[1]);
}

function main() {
  const files = walk(root);
  verifyArtifactInventory(files);
  verifyContractTextFiles(files);

  const landing = fs.readFileSync(path.join(root, 'HIBI LAB Landing.html'));
  const index = fs.readFileSync(path.join(root, 'index.html'));
  if (!landing.equals(index)) {
    fail('index.html and HIBI LAB Landing.html must remain byte-identical.');
  }

  const htmlFiles = files.filter((file) => file.endsWith('.html'));
  const htmlByPath = new Map(htmlFiles.map((file) => [file, fs.readFileSync(file, 'utf8')]));
  verifyStateBook(htmlByPath.get(path.join(root, '_p01-states-book.html')));
  for (const [file, html] of htmlByPath) {
    verifyHtml(file, html, htmlByPath);
  }

  const sharedStyle = styleBlocks(htmlByPath.get(path.join(root, 'HIBI LAB Landing.html')))[0];
  for (const sharedOnlyPage of ['HIBI LAB 404.html', 'HIBI LAB Order Received.html', 'HIBI LAB Shipping.html']) {
    const blocks = styleBlocks(htmlByPath.get(path.join(root, sharedOnlyPage)));
    if (blocks.length !== 1 || blocks[0] !== sharedStyle) {
      fail(`${sharedOnlyPage} now contains page-specific CSS; add it deliberately to PROTOTYPE_SOURCES before release.`);
    }
  }

  for (const formatterFile of ['HIBI LAB Shop.html', 'HIBI LAB Product.html', 'store-chrome.js']) {
    const source = fs.readFileSync(path.join(root, formatterFile), 'utf8');
    if (!source.includes('minimumFractionDigits:2') || !source.includes('maximumFractionDigits:2')) {
      fail(`${formatterFile} no longer enforces the approved two-decimal demo currency formatter.`);
    }
  }

  const emailPrototype = htmlByPath.get(path.join(root, 'HIBI LAB Email.html'));
  const handoff = fs.readFileSync(path.join(root, 'HIBI LAB - WP Handoff.md'), 'utf8');
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const packageLock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const prototypeCssBuilder = fs.readFileSync(path.join(root, 'scripts', 'prototype-css.js'), 'utf8');
  const buildVerifier = fs.readFileSync(path.join(root, 'scripts', 'verify-build.js'), 'utf8');
  const storeChrome = fs.readFileSync(path.join(root, 'store-chrome.js'), 'utf8');
  const imageBuildManifest = JSON.parse(
    fs.readFileSync(path.join(root, 'assets', 'image-build-manifest.json'), 'utf8'),
  );
  verifyCanonicalPricingContract(handoff, htmlByPath);
  verifyPdpSlaContract(htmlByPath);
  verifyPaymentStatePrototypes(htmlByPath, handoff);
  verifyCustomerDataMapping(handoff, htmlByPath);
  const landingTestimonialContract = [
    '**真實回饋只屬Homepage**',
    '`label` optional純文字最多80 grapheme',
    'PDP、Shop及任何分類archive一律唔讀、唔query、唔render真實回饋',
    'repeater冇有效row就連同標題、carousel及dots整段隱藏',
  ];
  requireText(handoff, landingTestimonialContract, 'Homepage-only testimonial contract');
  if (
    handoff.includes('`related_product`')
    || handoff.includes('`related_category`')
    || (handoff.match(/`hibilab_testimonials`/g) || []).length !== 1
  ) {
    fail('Testimonials must remain one Homepage-only repeater without product/category relations.');
  }
  const landingHtml = htmlByPath.get(path.join(root, 'HIBI LAB Landing.html'));
  if (!landingHtml.includes('id="tm-track"') || !landingHtml.includes('class="tm-card')) {
    fail('The approved Homepage testimonial component is missing.');
  }
  for (const testimonialFreePage of [...pdpPrototypeFiles, 'HIBI LAB Shop.html', '_p18-shop-guest.html']) {
    const page = htmlByPath.get(path.join(root, testimonialFreePage));
    if (page.includes('id="tm-track"') || page.includes('class="tm-card') || visibleText(page).includes('真實回饋')) {
      fail(`${testimonialFreePage} must not contain the Homepage-only testimonial component.`);
    }
  }
  for (const placeholder of canonicalEmailPlaceholders) {
    if (!emailPrototype.includes(placeholder) || !handoff.includes(placeholder)) {
      fail(`Canonical email placeholder is missing from the prototype or Handoff: ${placeholder}`);
    }
  }
  if (/\bwp_hibilab_/.test(handoff)) {
    fail('Handoff hard-codes a wp_ table prefix for a HIBI custom table.');
  }
  if (
    handoff.includes('§§21–24')
    || handoff.includes('Cart.html:602')
    || handoff.includes('Checkout.html:489,496')
    || handoff.includes('`Landing.html`')
    || handoff.includes('`Shop.html?cat=')
  ) {
    fail('Handoff contains a stale normative section range or line-number prototype reference.');
  }
  const documentedBuildDependencies = [
    ['tailwindcss', 'Tailwind'],
    ['sharp', 'Sharp'],
  ];
  for (const [packageName, label] of documentedBuildDependencies) {
    const version = packageJson.devDependencies && packageJson.devDependencies[packageName];
    if (!version || !handoff.includes(`${label} ${version}`)) {
      fail(`Handoff build dependency pin has drifted from package.json: ${packageName}.`);
    }
  }
  const expectedNodeEngine = '>=20.9.0';
  if (
    packageJson.engines?.node !== expectedNodeEngine
    || packageLock.packages?.['']?.engines?.node !== expectedNodeEngine
    || !handoff.includes('Node≥20.9.0')
  ) {
    fail('Node engine floor must match Sharp across package.json, package-lock.json and the Handoff.');
  }
  if (
    !prototypeCssBuilder.includes("excludeSelectors: ['.hibi-mark']")
    || !buildVerifier.includes("'body.hibilab-surface .hibi-mark'")
    || !buildVerifier.includes("'hibi-lab-logo.png'")
    || !handoff.includes('HIBI bundle明確排除`.hibi-mark`同`hibi-lab-logo.png`相對路徑')
  ) {
    fail('The Scent.M-owned HIBI mark is not structurally excluded from the HIBI CSS bundle.');
  }
  if (
    !storeChrome.includes('function productUrl(p)')
    || !storeChrome.includes('function productImage(p)')
    || !storeChrome.includes('url=productUrl(p)')
    || !handoff.includes('**不得**再為`img`加副檔名、亦不得硬編共用產品href')
    || !handoff.includes('例如`"340.00"`')
    || !handoff.includes('**永不預先HTML-escape**')
    || !handoff.includes('文字只用`textContent`')
    || !handoff.includes('回傳前唔做HTML escape')
  ) {
    fail('Production search results are not structurally wired to their server-projected URLs and price format.');
  }
  if (!handoff.includes('`wc_price()`') || !handoff.includes('decimal places=`2`')) {
    fail('Handoff is missing the canonical two-decimal WooCommerce money-display contract.');
  }
  const expectedImageRuntimeClasses = new Map([
    ['cat-home.png', 'term_media_seed'],
    ['cat-pet.png', 'term_media_seed'],
    ['cat-skincare.png', 'term_media_seed'],
    ['cat-sleep.png', 'term_media_seed'],
    ['prod-cleanser.png', 'product_media_seed'],
    ['prod-diffuser.png', 'product_media_seed'],
    ['prod-essencewater.png', 'product_media_seed'],
    ['prod-petmist.png', 'product_media_seed'],
    ['prod-q10.png', 'product_media_seed'],
    ['prod-sleepmist.png', 'product_media_seed'],
    ['hero-product.png', 'theme_static'],
    ['promise-candle.png', 'theme_static'],
    ['by-scentm.png', 'theme_static'],
  ]);
  if (
    !Array.isArray(imageBuildManifest.images)
    || imageBuildManifest.images.length !== expectedImageRuntimeClasses.size
  ) {
    fail('Image build manifest no longer has the exact approved runtime-owned asset set.');
  }
  for (const image of imageBuildManifest.images) {
    if (expectedImageRuntimeClasses.get(image.source) !== image.runtimeClass) {
      fail(`Image build runtime ownership has drifted: ${image.source}.`);
    }
  }
  if (
    !handoff.includes('`cat-*`×4係product-category ACF term image')
    || !handoff.includes('`prod-*`×6係demo／初始商品')
    || !handoff.includes('三張批准Landing品牌圖係真正static theme asset')
  ) {
    fail('Handoff is missing the manifest-backed image runtime-consumer contract.');
  }

  const memberCheckout = htmlByPath.get(path.join(root, 'HIBI LAB Checkout.html'));
  const guestCheckout = htmlByPath.get(path.join(root, '_p19b-checkout-guest.html'));
  const memberAccount = htmlByPath.get(path.join(root, 'HIBI LAB Account.html'));
  const guestThanks = htmlByPath.get(path.join(root, '_p22-orderreceived-guest.html'));
  const emailVariants = htmlByPath.get(path.join(root, '_p24-email-variants.html'));
  const accountStates = htmlByPath.get(path.join(root, '_p25-account-states.html'));
  const neutralPaymentStates = htmlByPath.get(path.join(root, '_p29-orderreceived-payment-states.html'));
  const belowThresholdCheckout = htmlByPath.get(path.join(root, '_p21-checkout-below-threshold.html'));
  const emptyCategory = htmlByPath.get(path.join(root, '_p13-shop-emptycat.html'));
  const birthdayCart = htmlByPath.get(path.join(root, '_p20-cart-birthday.html'));
  const memberProduct = htmlByPath.get(path.join(root, 'HIBI LAB Product.html'));
  const preorderProduct = htmlByPath.get(path.join(root, '_p27-pdp-preorder.html'));
  const tierCards = htmlByPath.get(path.join(root, 'HIBI LAB Tier Cards.html'));
  const cookieBanner = htmlByPath.get(path.join(root, '_p30-cookie-banner.html'));

  if (memberCheckout.includes('>已有帳戶？登入</a>') || memberCheckout.includes('id="createaccount"')) {
    fail('The signed-in member Checkout fixture exposes guest account controls.');
  }
  if (!guestCheckout.includes('>已有帳戶？登入</a>') || !guestCheckout.includes('id="createaccount"')) {
    fail('The Guest Checkout fixture is missing native login/account-creation controls.');
  }
  if (guestCheckout.includes('付款後會以電郵通知你設定密碼') || guestCheckout.includes('Demo＝「銀級會員」persona')) {
    fail('The Guest Checkout fixture contains a false payment-timing promise or member-persona note.');
  }
  for (const guestFixture of ['_p14-pdp-guest.html', '_p16-pdp-early-guest.html', '_p18-shop-guest.html', '_p19-cart-guest.html']) {
    if (htmlByPath.get(path.join(root, guestFixture)).includes('Demo＝「銀級會員」persona')) {
      fail(`Guest fixture still carries a member-persona implementation note: ${guestFixture}`);
    }
  }
  if (!memberAccount.includes('aria-readonly="true"') || memberAccount.includes('id="account-birthday-month"')) {
    fail('The member Account birthday must be read-only after first save.');
  }
  if (!accountStates.includes('id="birthday-unset-label"') || !accountStates.includes('儲存後如需更正')) {
    fail('The Account state helper is missing the one-time birthday-entry state.');
  }
  if (!accountStates.includes('成功寫入後即檢查並補排當月一封') || !accountStates.includes('每日香港時間 10:00 reconciliation 補漏') || !handoff.includes('同一香港曆年以semantic key保證最多一封')) {
    fail('The approved birthday-month catch-up contract is not synchronized across the Handoff and Account state helper.');
  }
  if (guestThanks.includes('建立帳戶以追蹤訂單')) {
    fail('The Guest thank-you page promises unsupported post-payment order claiming.');
  }

  const guestVariantStart = emailVariants.indexOf('①-B 訪客／無折扣行變體');
  const guestVariantEnd = emailVariants.indexOf('①-C', guestVariantStart);
  const guestVariant = emailVariants.slice(guestVariantStart, guestVariantEnd);
  if (guestVariantStart < 0 || guestVariantEnd < 0 || !guestVariant.includes('>查看訂單</a>') || !guestVariant.includes('href="{order_url}"')) {
    fail('The Guest confirmation email is missing its approved Woo order-key CTA.');
  }
  if (!neutralPaymentStates.includes('付款處理中')
      || !neutralPaymentStates.includes('狀態確認中')
      || !neutralPaymentStates.includes('尚未付款')) {
    fail('The pending/unknown/unpaid Order Received review fixture is incomplete.');
  }
  if (
    neutralPaymentStates.includes('id="tab-onhold"')
    || neutralPaymentStates.includes('id="state-onhold"')
    || neutralPaymentStates.includes('付款確認中 · Payment verification')
  ) {
    fail('The payment-state helper must not invent a sixth on-hold customer state.');
  }
  const paymentMainStart = neutralPaymentStates.indexOf('<main id="main"');
  const paymentMainEnd = neutralPaymentStates.indexOf('</main>', paymentMainStart);
  const paymentCustomerUi = neutralPaymentStates.slice(paymentMainStart, paymentMainEnd);
  if (paymentMainStart < 0 || paymentMainEnd < 0 || paymentCustomerUi.includes('WooCommerce') || paymentCustomerUi.includes('success tick')) {
    fail('The pending/unknown/unpaid customer UI leaks developer terminology.');
  }
  if (!neutralPaymentStates.includes("event.key==='ArrowRight'") || !neutralPaymentStates.includes("event.key==='Home'") || !neutralPaymentStates.includes('tabindex="-1"')) {
    fail('The payment-state review tabs are missing the keyboard/roving-tabindex contract.');
  }
  if (
    !memberAccount.includes('data-wc-order-pay-pending')
    || !memberAccount.includes('PaymentEvidenceService=unpaid')
    || memberAccount.includes('WC my-account 對 failed/pending 單原生出「支付」action')
  ) {
    fail('Account Pay must use the canonical unpaid/order-pay gate instead of raw Woo status.');
  }
  if (
    !memberAccount.includes('data-wc-logout-pending')
    || !memberAccount.includes('wc_logout_url()')
    || memberAccount.includes('id="logout-modal"')
    || memberAccount.includes("closest('#acct-logout-btn')")
  ) {
    fail('Account logout must have one visible Woo nonce endpoint contract and no orphan modal.');
  }
  if (
    !memberAccount.includes('Phase 1＝20/頁')
    || !memberAccount.includes('stable `(next_due_at_utc,id)` cursor')
    || memberAccount.includes('過 ~30 先加分頁')
  ) {
    fail('Repurchase reminders must use the canonical 20-per-page stable pagination policy.');
  }
  if (!memberProduct.includes('首次 confirmed_paid|confirmed_zero transition 建立／重錨 schedule') || memberProduct.includes('訂單完成建 schedule')) {
    fail('Repurchase reminders must anchor on first confirmed payment, not fulfilment completion.');
  }
  if (
    !preorderProduct.includes('首次 PaymentEvidenceService confirmed_paid|confirmed_zero transition 先建立／重錨 schedule')
    || !preorderProduct.includes('履約、browser return 或 Admin status change 永不建立')
    || preorderProduct.includes('訂單完成建 schedule')
  ) {
    fail('The preorder PDP reminder contract must use the canonical first-confirmed-payment anchor.');
  }
  if (tierCards.includes('超標未結算') || !tierCards.includes('正常模型達標即升級')) {
    fail('Tier-card guidance must not reintroduce a settlement cycle.');
  }
  if (
    accountStates.includes('超標未結算')
    || accountStates.includes('結算重算時降級')
    || accountStates.includes('升級喺訂單完成即時生效')
    || !accountStates.includes('付款／退款確認後即時升降')
    || !accountStates.includes('首次驗證 `PaymentEvidenceService=confirmed_paid|confirmed_zero`')
    || !accountStates.includes('唔代表有結算週期')
  ) {
    fail('The Account state helper must use the canonical rolling VIP lifecycle with no settlement lag.');
  }
  if (
    !memberAccount.includes('全額成功退款而且冇餘下履約責任')
    || !memberAccount.includes('部分退款則保留正常履約線')
  ) {
    fail('Account cancellation comments must follow the canonical successful-refund projection.');
  }
  const emptyCategoryInitialApplyCount = (emptyCategory.match(/\n  setBanner\(activeDept\); apply\(\);/g) || []).length;
  if (
    !emptyCategory.includes('initialDept=hasSearchParam?"all":"sleep"')
    || !emptyCategory.includes('requestedDept=(initialParams.get("cat")||"").trim()')
    || !emptyCategory.includes('initialDept=document.querySelector')
    || emptyCategoryInitialApplyCount !== 1
    || emptyCategory.includes('id="plp-caturl"')
    || emptyCategory.includes('setTimeout(function(){p.click();},60)')
  ) {
    fail('The empty-category helper must have one deterministic URL-state controller and one initial apply.');
  }
  if (
    !birthdayCart.includes('id="birthday-offer-status"')
    || !birthdayCart.includes("offerStatus.textContent='優惠碼 '+couponCode+' 較抵，已自動套用。'")
    || !birthdayCart.includes("offerStatus.textContent='生日會員價已自動生效，無需優惠碼。'")
  ) {
    fail('The birthday cart status must describe the actual winning discount.');
  }
  if (
    !belowThresholdCheckout.includes('var DEMO_PRICING=')
    || !belowThresholdCheckout.includes('ship.textContent=projection.shipping')
    || !belowThresholdCheckout.includes('tot.textContent=projection.coupons[couponCode]')
    || !belowThresholdCheckout.includes('picker.style.display=(sel&&sel.value==="pickup")?"":"none";paint();')
  ) {
    fail('The below-threshold Checkout helper must update shipping and total from one projection.');
  }
  if (
    !cookieBanner.includes('class="scentm-consent-banner"')
    || !prototypeCssBuilder.includes("file: '_p30-cookie-banner.html'")
    || !prototypeCssBuilder.includes('global: true')
    || !buildVerifier.includes("'.scentm-consent-banner'")
  ) {
    fail('The approved cross-site consent banner CSS is missing from the production build contract.');
  }
  if (!handoff.includes('**最終勝出 quote path**') || !handoff.includes('pre-coupon') || !handoff.includes('Woo Hold stock（2026-07-27 客戶裁決 A）＝60 分鐘')) {
    fail('The approved free-shipping or Hold Stock contract is missing from the Handoff.');
  }
  if (!handoff.includes('immutable order meta 保存落單時winner path、門檻、eligible subtotal及達標結果') || !handoff.includes('ShipmentEvidenceService') || !handoff.includes('checkout 可建立帳戶＝ON')) {
    fail('A historical shipping, final-delivery, or native account-creation contract is missing from the Handoff.');
  }
  if (handoff.includes('`is_paid()`')) {
    fail('Handoff must not use Woo status-derived is_paid() as payment truth.');
  }
  const structuralContracts = [
    'read-only `PaymentEvidenceService`',
    '`PaymentConfirmationProjector`係唯一確認writer',
    '`_hibilab_checkout_seal_v1`',
    '`confirmation_projection_due`',
    'Admin、REST、CSV/import、bulk及第三方同步任何入口都必須server-side拒絕改寫',
    '**exactly one current shipment**',
    '`_hibilab_shipment_projection`',
    '`hibilab_shipment_event`',
    '`dedupe_key UNIQUE`',
    '列出 provider 端全部 current shipments',
    'compare-and-set',
    '`order_completed:{order_id}`',
    '「修正訂單狀態」action',
    '`external_refund_classification:{stripe_account_id}:{livemode}:{stripe_refund_id}`',
    '精確Stripe refund ID',
    '`hibilab_external_refund_recovery`',
    '`_hibilab_refund_kind=zero_fulfilment_adjustment|external_fulfilment_adjustment`',
    '兩筆HK$50.00共同覆蓋HK$100.00 item',
    '`active_order_id UNIQUE`',
    'floor(line_total × (c+k) / Q) − floor(line_total × c / Q)',
    'restock map先按owner aggregate',
    '正常Woo item refund同recovery並發',
    'active label先void',
    '網站管理員確認已restock',
    '確認未restock並執行一次',
    '`scentm_manager`不可操作',
    'observation早過shipment relation仍可稍後配對',
    '付款失敗亦唔回滾已建帳戶',
    '`PaymentEvidenceService` contract matrix逐格交叉測',
    'Eligible subtotal 固定讀 §6 **最終勝出 quote path** 入面可配送商品嘅 pre-coupon item prices',
    'Account／REST／直接POST／兩個並發request只可成功寫一次',
    '正確／錯誤order key',
    '2026-07-27 補寄選 B',
    '**歷史付款身份凍結**',
    '**禁止正金額本地繞過**',
    '`hibilab_refund_operation`',
    '`hibilab_stock_owner_state`',
    '`hibilab_order_guard`',
    '`hibilab_checkout_stock_claim`',
    '`_hibilab_catalog_schema=hibilab-v1`',
    '`active_order_item_id UNIQUE`',
    '`S-H-C`只可保守低估、不可高估',
    'Claim state只准`active|consumed|released`',
    '拒絕任何`state=active` checkout stock claim（不論有冇open incident）',
    '`woocommerce_payment_complete_reduce_order_stock`',
    '`woocommerce_can_reduce_order_stock`',
    '保持Woo原生pass-through',
    '同一pending order／claim返回Checkout',
    '`woocommerce_can_restock_refunded_items`',
    '`woocommerce_order_fully_refunded_status`',
    '`woocommerce_can_restore_order_stock`',
    '**單一OrderLifecycleGuard封status旁路**',
    '`wc_order_fully_refunded()`',
    'confirmed-paid HIBI order改failed／cancelled',
    '**角色寫入單一owner**',
    '**Canonical consent／revocation service**',
    '`rfc_message_id UNIQUE`',
    '`customer_order_confirmed:{order_id}`',
    '公開catalog（regular／有效公開sale）',
    '**Action Scheduler lifecycle**',
    '`UpgradeCoordinator`',
    "`FeaturesUtil::declare_compatibility('cart_checkout_blocks', ..., false)`",
    '**Privacy callback ownership／分頁**',
    '**Cache matrix**',
    '**Backup／restore契約（客戶批准7B）**',
    '**Stripe帳戶切換（2026-07-29 客戶批准 B）**',
    '`stripe_connection_generation` state',
    '**Coordinator phase graph（唯一合法狀態機）**',
    '**Maintenance-safe收斂而唔自鎖**',
    '**全站所有使用官方Woo Stripe Gateway嘅Checkout、order-pay、付款、退款及其他provider mutation一律fail closed**',
    '**Stripe帳戶切換安全閘**',
    '暫接A途中core deactivate／files missing／Recovery Mode而WordPress仍載入theme時，非HIBI Woo Stripe仍被sentinel拒絕',
    '另獨立注入bootstrap fatal，驗request終止、外部monitor告警、rollback後同一operation收斂',
    '**暫時reauth舊帳戶做售後絕不執行cleanup**',
    '**舊帳戶售後maintenance reauth**',
    '**舊帳戶事件發現係明示營運契約**',
    'A已斷線後新dispute→Stripe原生alert→ack→reauth A→final truth→接回正常account',
    'A→B→C後仍可按A訂單精確暫接A',
    '唔新增客面UI或多帳戶管理Dashboard',
    '`mprice:string|null`',
    '`Cache-Control: private, no-store`',
    '同PLP呼叫同一個canonical catalog pricing／eligibility projection',
    '唔以WCAG conformant為聲稱或release gate',
    '§§21–25',
    '**Woo email replacement allowlist（只限HIBI order）**',
    '**`customer_on_hold_order`對HIBI order固定停用**',
    '### 1.1 唯一 component ownership（後文全部用呢張表解讀）',
    '由`hibilab-commerce`擁有嘅自訂 wc-ajax endpoints',
    '批准production class固定為`.scentm-consent-banner`',
    '**唯一site-wide serialization primitive（同樣唔留畀Dev自選）**',
    '`{$wpdb->prefix}hibilab_site_guard`',
    '`active_operation_uuid CHAR(36)`',
    '`{$wpdb->prefix}hibilab_payment_confirmation`',
    '**付款確認投影最少化**',
    '完全唔另存canonical Woo meta mirror',
    '`blocked`唯一出路係`blocked→resume_phase`',
    'target reconciliation失敗→reconciling_target',
    '建立order-bound email semantic outbox row',
    '`hibilab-commerce/hibilab-commerce.php`',
    '* Plugin Name: HIBI LAB Commerce',
    '* Version: 0.1.0',
    '* Requires at least: 7.0',
    '* Requires PHP: 8.2',
    '* Text Domain: hibilab-commerce',
    '* Domain Path: /languages',
    '* Update URI: false',
    '* Requires Plugins: woocommerce',
    '* WC requires at least: 10.9',
    '* WC tested up to: 10.9.4',
    '`CHANGELOG.md`',
    '`tools/verify-release-metadata.php`',
    '`composer validate --strict`',
    'PHPStan固定level 8',
    '官方managed QIT唔係必要release dependency',
    '`wp_set_script_translations( $handle, \'hibilab-commerce\'',
    '`hibilab-commerce-zh_HK.po`',
    'theme text domain `scentm`',
    "`load_plugin_textdomain( 'hibilab-commerce'",
    "`load_theme_textdomain( 'scentm'",
    '`languages/zh_HK.po`',
    '`languages/zh_HK.mo`',
    '禁止誤用`scentm-zh_HK.mo`',
    '兩邊唔交叉、唔複製同一字串owner',
    'Dev不得自行填GPL／proprietary字眼或虛構URL',
    '`playwright.config.ts`',
    '`tests/e2e/global-setup.ts`',
    '`test:e2e:hpos=playwright test --config=playwright.config.ts --project=hpos`',
    '`test:e2e:legacy=playwright test --config=playwright.config.ts --project=legacy`',
    '`npm run test:e2e:hpos`、`npm run test:e2e:legacy`',
    'immutable confirmation row INSERT前',
    '全程不得建立或測試Woo payment-confirmation meta mirror',
  ];
  for (const contract of structuralContracts) {
    if (!handoff.includes(contract)) {
      fail(`Handoff is missing a structural payment/fulfilment contract: ${contract}`);
    }
  }
  const forbiddenStructuralClaims = [
    'current obligation-bearing shipment set **`count > 0`**',
    'projection reconciler只按付款／shipment證據修回應有Woo status',
    '日後同email註冊／安全認領',
    'Stripe Dashboard外部退款屬待客戶拍板營運政策',
    '**尚待客戶拍板**：會員喺生日月1日之後',
    '預訂／庫存支援只用兩張細表',
    '付款完成前gate住Woo stock reduction',
    '_hibilab_payment_confirmation_v1',
    '寫meta後、read-back前crash',
    '連同 on-hold 投影全部唔出成功 tick',
  ];
  for (const claim of forbiddenStructuralClaims) {
    if (handoff.includes(claim)) {
      fail(`Handoff still contains a superseded structural claim: ${claim}`);
    }
  }
  if (belowThresholdCheckout.includes('demo 兩方式都免運') || !belowThresholdCheckout.includes('送上門 HK$45.00／自取點 HK$32.00')) {
    fail('The below-threshold Checkout fixture carries a stale shipping comment.');
  }
  const unresolvedApprovedDecisions = [
    '免運門檻口徑 — 待客戶拍板',
    '訂單狀態／時間線 = 4 步（映射待客戶拍板）',
    '生日修改政策待客戶拍板',
    'Guest 售後閉環 — 開戶入口待客戶拍板',
    'Woo Hold stock時限待客戶最後拍板',
    'pending`／`on-hold`嘅客面名稱及處理仍待最後',
    'Guest email可見CTA位置屬待客戶批准項',
  ];
  for (const stale of unresolvedApprovedDecisions) {
    if (handoff.includes(stale)) {
      fail(`Handoff still contains an already-approved pending decision: ${stale}`);
    }
  }

  for (const file of files.filter((candidate) => candidate.endsWith('.js'))) {
    verifyJavaScript(file);
  }

  console.log(`Verified ${files.length} delivery artifacts, ${htmlFiles.length} HTML prototypes and repository JavaScript.`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
