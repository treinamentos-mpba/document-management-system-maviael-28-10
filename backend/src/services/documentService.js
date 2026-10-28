const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');
const fileRepository = require('../repositories/fileRepository');

async function create(file, owner) {
  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    mimeType: file.mimetype || 'application/octet-stream',
    storageName: file.filename,
  };

  try {
    documentRepository.create(document);
  } catch (error) {
    await fileRepository.remove(file.filename);
    throw error;
  }

  const { storageName, ...publicDocument } = document;
  return publicDocument;
}

async function listByOwner(owner) {
  return documentRepository.findByOwner(owner).map(({ storageName, ...document }) => document);
}

async function getDownload(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner || !(await fileRepository.exists(document.storageName))) {
    const error = new Error('Documento não encontrado.');
    error.statusCode = 404;
    error.code = 'DOCUMENT_NOT_FOUND';
    throw error;
  }

  return { document, filePath: fileRepository.getPath(document.storageName) };
}

module.exports = { create, getDownload, listByOwner };