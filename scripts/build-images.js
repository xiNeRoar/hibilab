'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'assets', 'image-build-manifest.json');
const verifyOnly = process.argv.includes('--verify-only');
const expectedImageCount = 13;
const expectedRuntimeClassCounts = {
  term_media_seed: 4,
  product_media_seed: 6,
  theme_static: 3,
};

function pathWithin(base, relativePath) {
  const absolutePath = path.resolve(base, relativePath);
  const relative = path.relative(base, absolutePath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path escapes project root: ${relativePath}`);
  }

  return absolutePath;
}

async function sha256(filePath) {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function readManifest() {
  const raw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);

  if (manifest.schemaVersion !== 1) {
    throw new Error('Unsupported image manifest schema version.');
  }

  if (!Array.isArray(manifest.images) || manifest.images.length !== expectedImageCount) {
    throw new Error(`Image manifest must contain exactly ${expectedImageCount} selected PNG build inputs.`);
  }

  if (!Number.isInteger(manifest.maxBytesPerImage) || manifest.maxBytesPerImage <= 0) {
    throw new Error('maxBytesPerImage must be a positive integer.');
  }

  if (!Array.isArray(manifest.qualityCandidates) || manifest.qualityCandidates.length === 0) {
    throw new Error('qualityCandidates must contain at least one WebP quality.');
  }

  const sourceNames = new Set();
  const outputNames = new Set();
  const runtimeClassCounts = Object.fromEntries(
    Object.keys(expectedRuntimeClassCounts).map((runtimeClass) => [runtimeClass, 0]),
  );
  for (const image of manifest.images) {
    if (!image.source.endsWith('.png') || !image.output.endsWith('.webp')) {
      throw new Error(`Invalid source/output extension: ${JSON.stringify(image)}`);
    }
    if (sourceNames.has(image.source) || outputNames.has(image.output)) {
      throw new Error(`Duplicate image manifest entry: ${JSON.stringify(image)}`);
    }
    if (!Object.hasOwn(expectedRuntimeClassCounts, image.runtimeClass)) {
      throw new Error(`Invalid image runtimeClass: ${JSON.stringify(image)}`);
    }
    sourceNames.add(image.source);
    outputNames.add(image.output);
    runtimeClassCounts[image.runtimeClass] += 1;
  }

  for (const [runtimeClass, expectedCount] of Object.entries(expectedRuntimeClassCounts)) {
    if (runtimeClassCounts[runtimeClass] !== expectedCount) {
      throw new Error(
        `Image manifest must contain exactly ${expectedCount} ${runtimeClass} entries.`,
      );
    }
  }

  return manifest;
}

async function readGeneratedManifest(generatedManifestPath) {
  const raw = await fs.readFile(generatedManifestPath, 'utf8');
  const generatedManifest = JSON.parse(raw);

  if (generatedManifest.schemaVersion !== 1 || !Array.isArray(generatedManifest.images)) {
    throw new Error('Generated image manifest has an unsupported structure.');
  }

  return generatedManifest;
}

function assertGeneratedEntry(actual, expected, qualities) {
  for (const key of [
    'source',
    'output',
    'bytes',
    'width',
    'height',
    'hasAlpha',
    'sourceSha256',
    'outputSha256',
    'runtimeClass',
  ]) {
    if (actual[key] !== expected[key]) {
      throw new Error(
        `Generated image manifest is stale for ${expected.source}: ${key} does not match.`,
      );
    }
  }

  if (!qualities.includes(actual.quality)) {
    throw new Error(`Generated image manifest has an invalid quality for ${expected.source}.`);
  }
}

async function inspectOutput(sourcePath, outputPath, maxBytes) {
  const [sourceMetadata, outputMetadata, outputStat] = await Promise.all([
    sharp(sourcePath).metadata(),
    sharp(outputPath).metadata(),
    fs.stat(outputPath),
  ]);

  if (outputMetadata.format !== 'webp') {
    throw new Error(`${path.basename(outputPath)} is not WebP.`);
  }
  if (outputMetadata.width !== sourceMetadata.width || outputMetadata.height !== sourceMetadata.height) {
    throw new Error(`${path.basename(outputPath)} dimensions differ from its source.`);
  }
  if (sourceMetadata.hasAlpha && !outputMetadata.hasAlpha) {
    throw new Error(`${path.basename(outputPath)} lost its alpha channel.`);
  }
  if (outputStat.size > maxBytes) {
    throw new Error(`${path.basename(outputPath)} exceeds ${maxBytes} bytes.`);
  }

  return {
    bytes: outputStat.size,
    width: outputMetadata.width,
    height: outputMetadata.height,
    hasAlpha: Boolean(outputMetadata.hasAlpha),
  };
}

async function renderSelectedImage(sourcePath, qualities, maxBytes) {
  for (const quality of qualities) {
    const buffer = await sharp(sourcePath)
      .webp({ quality, alphaQuality: 100, effort: 6, smartSubsample: true })
      .toBuffer();

    if (buffer.length <= maxBytes) {
      return { buffer, quality };
    }
  }

  throw new Error(`${path.basename(sourcePath)} cannot meet the configured size limit without resizing.`);
}

async function main() {
  const manifest = await readManifest();
  const outputDirectory = pathWithin(root, manifest.outputDirectory);
  const generatedManifestPath = path.join(outputDirectory, 'manifest.json');

  if (!verifyOnly) {
    await fs.rm(outputDirectory, { recursive: true, force: true });
    await fs.mkdir(outputDirectory, { recursive: true });
  }

  const generated = [];
  const recordedManifest = verifyOnly
    ? await readGeneratedManifest(generatedManifestPath)
    : null;

  if (recordedManifest && recordedManifest.images.length !== manifest.images.length) {
    throw new Error('Generated image manifest does not match the selected build input count.');
  }

  for (const image of manifest.images) {
    const sourcePath = pathWithin(root, image.source);
    const outputPath = pathWithin(outputDirectory, image.output);
    await fs.access(sourcePath);

    let quality = null;
    if (!verifyOnly) {
      const rendered = await renderSelectedImage(
        sourcePath,
        manifest.qualityCandidates,
        manifest.maxBytesPerImage,
      );
      quality = rendered.quality;
      await fs.writeFile(outputPath, rendered.buffer);
    }

    const output = await inspectOutput(sourcePath, outputPath, manifest.maxBytesPerImage);
    const generatedEntry = {
      source: image.source,
      output: path.posix.join(manifest.outputDirectory, image.output),
      runtimeClass: image.runtimeClass,
      quality,
      ...output,
      sourceSha256: await sha256(sourcePath),
      outputSha256: await sha256(outputPath),
    };

    if (recordedManifest) {
      const recordedEntry = recordedManifest.images[generated.length];
      assertGeneratedEntry(
        recordedEntry,
        { ...generatedEntry, quality: recordedEntry && recordedEntry.quality },
        manifest.qualityCandidates,
      );

      const expectedRender = await renderSelectedImage(
        sourcePath,
        manifest.qualityCandidates,
        manifest.maxBytesPerImage,
      );
      const expectedOutputSha256 = crypto
        .createHash('sha256')
        .update(expectedRender.buffer)
        .digest('hex');

      if (
        recordedEntry.quality !== expectedRender.quality
        || generatedEntry.outputSha256 !== expectedOutputSha256
      ) {
        throw new Error(
          `Generated WebP is stale for ${image.source}; rebuild from the current selected input.`,
        );
      }
      generatedEntry.quality = recordedEntry.quality;
    }

    generated.push(generatedEntry);
  }

  if (!verifyOnly) {
    await fs.writeFile(
      generatedManifestPath,
      `${JSON.stringify({ schemaVersion: 1, images: generated }, null, 2)}\n`,
      'utf8',
    );
  } else {
    const expectedFiles = new Set([
      'manifest.json',
      ...manifest.images.map((image) => image.output),
    ]);
    const outputFiles = await fs.readdir(outputDirectory);
    const unexpectedFiles = outputFiles.filter((file) => !expectedFiles.has(file));
    const missingFiles = [...expectedFiles].filter((file) => !outputFiles.includes(file));

    if (unexpectedFiles.length > 0 || missingFiles.length > 0) {
      throw new Error(
        `Generated image directory differs from the manifest (missing: ${missingFiles.join(', ') || 'none'}; unexpected: ${unexpectedFiles.join(', ') || 'none'}).`,
      );
    }
  }

  console.log(`${verifyOnly ? 'Verified' : 'Built and verified'} ${generated.length} WebP images.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
