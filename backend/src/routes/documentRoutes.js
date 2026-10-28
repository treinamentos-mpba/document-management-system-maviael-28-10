const express = require('express');
const multer = require('multer');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { getMaxFileSizeBytes, getStorageDirectory } = require('../config/documentConfig');
const documentController = require('../controllers/documentController');

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const directory = getStorageDirectory();
    fs.mkdir(directory, { recursive: true }, (error) => callback(error, directory));
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

const upload = multer({
  storage,
  defParamCharset: 'utf8',
  limits: { fileSize: getMaxFileSizeBytes(), files: 1 },
});

router.post('/upload', documentController.requireUser, upload.single('file'), documentController.upload);
router.get('/documents', documentController.requireUser, documentController.list);
router.get('/documents/:id/download', documentController.requireUser, documentController.download);

module.exports = router;