const fs = require('node:fs/promises');
const path = require('node:path');
const { getStorageDirectory } = require('../config/documentConfig');

function getPath(storageName) {
  if (!storageName || path.basename(storageName) !== storageName) {
    return null;
  }

  return path.join(getStorageDirectory(), storageName);
}

async function exists(storageName) {
  const filePath = getPath(storageName);
  if (!filePath) {
    return false;
  }

  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function remove(storageName) {
  const filePath = getPath(storageName);
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = { exists, getPath, remove };