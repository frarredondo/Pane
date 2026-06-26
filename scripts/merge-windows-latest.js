#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const WINDOWS_EXE_PATTERN = /Windows-(x64|arm64)\.exe$/;

function usage() {
  console.error('Usage: node scripts/merge-windows-latest.js <x64-latest.yml> <arm64-latest.yml> <output-latest.yml>');
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function readUpdateInfo(filePath, expectedArch) {
  if (!filePath) {
    fail(`Missing ${expectedArch} latest.yml path`);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`${expectedArch} latest.yml not found: ${absolutePath}`);
  }

  let info;
  try {
    info = yaml.load(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    fail(`Failed to parse ${absolutePath}: ${getErrorMessage(error)}`);
  }

  if (!info || typeof info !== 'object') {
    fail(`${absolutePath} did not contain a YAML object`);
  }

  if (typeof info.version !== 'string' || !info.version.trim()) {
    fail(`${absolutePath} is missing version`);
  }

  if (!Array.isArray(info.files) || info.files.length === 0) {
    fail(`${absolutePath} is missing files`);
  }

  const matchingFiles = info.files.filter(file => {
    return file && typeof file.url === 'string' && file.url.endsWith(`Windows-${expectedArch}.exe`);
  });

  if (matchingFiles.length !== 1) {
    fail(`${absolutePath} must contain exactly one Windows-${expectedArch}.exe file entry; found ${matchingFiles.length}`);
  }

  const file = matchingFiles[0];
  if (typeof file.sha512 !== 'string' || !file.sha512.trim()) {
    fail(`${absolutePath} ${file.url} is missing sha512`);
  }

  if (typeof file.size !== 'number' || file.size <= 0) {
    fail(`${absolutePath} ${file.url} is missing a positive size`);
  }

  return { info, file };
}

function ensureNoUnexpectedWindowsInstaller(info, sourcePath) {
  const windowsInstallers = info.files.filter(file => {
    return file && typeof file.url === 'string' && WINDOWS_EXE_PATTERN.test(file.url);
  });

  if (windowsInstallers.length !== 1) {
    fail(`${sourcePath} must contain one Windows installer entry before merging; found ${windowsInstallers.length}`);
  }
}

function main() {
  const [x64Path, arm64Path, outputPath] = process.argv.slice(2);

  if (!x64Path || !arm64Path || !outputPath) {
    usage();
    process.exit(1);
  }

  const x64 = readUpdateInfo(x64Path, 'x64');
  const arm64 = readUpdateInfo(arm64Path, 'arm64');
  ensureNoUnexpectedWindowsInstaller(x64.info, path.resolve(x64Path));
  ensureNoUnexpectedWindowsInstaller(arm64.info, path.resolve(arm64Path));

  if (x64.info.version !== arm64.info.version) {
    fail(`Version mismatch: x64=${x64.info.version}, arm64=${arm64.info.version}`);
  }

  const releaseDate = x64.info.releaseDate || arm64.info.releaseDate;
  if (releaseDate && typeof releaseDate !== 'string') {
    fail('releaseDate must be a string when present');
  }

  const merged = {
    version: x64.info.version,
    files: [x64.file, arm64.file],
    path: x64.file.url,
    sha512: x64.file.sha512,
  };

  if (releaseDate) {
    merged.releaseDate = releaseDate;
  }

  const absoluteOutputPath = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  fs.writeFileSync(absoluteOutputPath, yaml.dump(merged, { lineWidth: -1 }), 'utf8');

  console.log(`Merged Windows latest.yml for ${merged.version}:`);
  for (const file of merged.files) {
    console.log(`  - ${file.url} (${file.size} bytes)`);
  }
  console.log(`Wrote ${absoluteOutputPath}`);
}

main();
