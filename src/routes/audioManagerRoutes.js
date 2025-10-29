const express = require('express');
const router = express.Router();
const audioManagerController = require('../controllers/audioManagerController');
const upload = require('../middleware/upload');

/**
 * @route   POST /api/audio-manager/upload
 * @desc    Upload a new managed audio file
 * @access  Public
 * @body    {file: audio, id: string, title: string, description: string}
 */
router.post('/upload', upload.single('audio'), audioManagerController.uploadAudio);

/**
 * @route   GET /api/audio-manager/list
 * @desc    Get list of all managed audio files
 * @access  Public
 * @query   {page: number, limit: number, search: string}
 */
router.get('/list', audioManagerController.listAudioFiles);

/**
 * @route   GET /api/audio-manager/info/:id
 * @desc    Get specific audio file information
 * @access  Public
 */
router.get('/info/:id', audioManagerController.getAudioInfo);

/**
 * @route   GET /api/audio-manager/stream/:id
 * @desc    Stream audio file with range support
 * @access  Public
 */
router.get('/stream/:id', audioManagerController.streamAudio);

/**
 * @route   GET /api/audio-manager/download/:id
 * @desc    Download audio file
 * @access  Public
 */
router.get('/download/:id', audioManagerController.downloadAudio);

/**
 * @route   PUT /api/audio-manager/update/:id
 * @desc    Update audio file info
 * @access  Public
 * @body    {title: string, description: string}
 */
router.put('/update/:id', audioManagerController.updateAudioInfo);

/**
 * @route   DELETE /api/audio-manager/delete/:id
 * @desc    Delete audio file
 * @access  Public
 */
router.delete('/delete/:id', audioManagerController.deleteAudio);

/**
 * @route   GET /api/audio-manager/statistics
 * @desc    Get statistics about managed audio files
 * @access  Public
 */
router.get('/statistics', audioManagerController.getStatistics);

module.exports = router;
