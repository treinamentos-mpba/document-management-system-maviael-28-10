const documentService = require('../services/documentService');

function requireUser(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();
  if (!owner || owner.length > 128) {
    return res.status(400).json({
      error: { code: 'INVALID_USER_ID', message: 'Informe um identificador de usuário válido.' },
    });
  }

  req.owner = owner;
  return next();
}

async function upload(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo "file".' },
    });
  }

  try {
    const document = await documentService.create(req.file, req.owner);
    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const documents = await documentService.listByOwner(req.owner);
    return res.json(documents);
  } catch (error) {
    return next(error);
  }
}

async function download(req, res, next) {
  try {
    const { document, filePath } = await documentService.getDownload(req.params.id, req.owner);
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    return res.download(filePath, document.originalName, (error) => {
      if (error && !res.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { download, list, requireUser, upload };