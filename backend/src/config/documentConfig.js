const path = require('node:path');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function getStorageDirectory() {
  return path.resolve(
    process.env.STORAGE_DIR || path.resolve(__dirname, '../../storage')
  );
}

function getMaxFileSizeBytes() {
  const configuredSize = Number(process.env.UPLOAD_MAX_FILE_SIZE_BYTES);
  return Number.isSafeInteger(configuredSize) && configuredSize > 0
    ? configuredSize
    : DEFAULT_MAX_FILE_SIZE_BYTES;
}

module.exports = { getMaxFileSizeBytes, getStorageDirectory };