const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

/**
 * @route   POST /api/backup/create
 * @desc    Create a database backup
 * @access  Public
 */
router.post('/create', backupController.createBackup);

/**
 * @route   GET /api/backup/list
 * @desc    List all available backups
 * @access  Public
 */
router.get('/list', backupController.listBackups);

/**
 * @route   GET /api/backup/download/:filename
 * @desc    Download a specific backup file
 * @access  Public
 */
router.get('/download/:filename', backupController.downloadBackup);

/**
 * @route   POST /api/backup/restore/:filename
 * @desc    Restore database from backup
 * @access  Public
 */
router.post('/restore/:filename', backupController.restoreBackup);

/**
 * @route   DELETE /api/backup/delete/:filename
 * @desc    Delete a backup file
 * @access  Public
 */
router.delete('/delete/:filename', backupController.deleteBackup);

module.exports = router;
