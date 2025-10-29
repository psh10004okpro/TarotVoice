const express = require('express');
const router = express.Router();
const sttController = require('../controllers/sttController');
const upload = require('../middleware/upload');

/**
 * @route   POST /api/stt/transcribe
 * @desc    Transcribe audio to text
 * @access  Public
 * @body    {file: audio, service: 'google'|'whisper', language: 'ko'}
 */
router.post('/transcribe', upload.single('audio'), sttController.transcribe);

/**
 * @route   POST /api/stt/translate
 * @desc    Translate audio to English text (Whisper only)
 * @access  Public
 * @body    {file: audio}
 */
router.post('/translate', upload.single('audio'), sttController.translate);

module.exports = router;
