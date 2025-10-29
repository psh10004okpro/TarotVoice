const express = require('express');
const router = express.Router();
const ttsController = require('../controllers/ttsController');

/**
 * @route   POST /api/tts/generate
 * @desc    Generate speech from text with caching
 * @access  Public
 * @body    {text: string, service: 'elevenlabs'|'naver'|'google', language: 'ko-KR', voiceId/speaker/voiceName: string}
 */
router.post('/generate', ttsController.generateSpeech);

/**
 * @route   GET /api/tts/stream/:id
 * @desc    Stream audio file with range support
 * @access  Public
 */
router.get('/stream/:id', ttsController.streamAudio);

/**
 * @route   GET /api/tts/audio/:id
 * @desc    Download audio file
 * @access  Public
 */
router.get('/audio/:id', ttsController.downloadAudio);

/**
 * @route   GET /api/tts/info/:id
 * @desc    Get audio file information
 * @access  Public
 */
router.get('/info/:id', ttsController.getAudioInfo);

/**
 * @route   GET /api/tts/list
 * @desc    List all cached audio files
 * @access  Public
 * @query   {page: number, limit: number, service: string, language: string}
 */
router.get('/list', ttsController.listAudioFiles);

/**
 * @route   GET /api/tts/voices/:service
 * @desc    Get available voices for a service
 * @access  Public
 * @query   {language: string} (for Google)
 */
router.get('/voices/:service', ttsController.getVoices);

module.exports = router;
