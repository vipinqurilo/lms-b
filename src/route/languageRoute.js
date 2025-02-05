const express = require('express');
const router = express.Router();
const languageController = require('../controller/languageController');

// Routes for Language CRUD operations
router.post('/', languageController.createLanguage);
router.get('/', languageController.getLanguages);
router.get('/:id', languageController.getLanguageById);
router.put('/:id', languageController.updateLanguage);
router.delete('/:id', languageController.deleteLanguage);

module.exports = router;