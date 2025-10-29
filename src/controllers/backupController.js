const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

/**
 * Create a backup of the SQLite database
 */
exports.createBackup = async (req, res, next) => {
  try {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({
        success: false,
        error: { message: 'Database file not found' },
      });
    }

    // Create backups directory if it doesn't exist
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
                      new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupPath = path.join(backupDir, `database_backup_${timestamp}.sqlite`);

    // Copy database file
    fs.copyFileSync(dbPath, backupPath);

    // Get file size
    const stats = fs.statSync(backupPath);

    res.json({
      success: true,
      message: 'Database backup created successfully',
      data: {
        backupFile: path.basename(backupPath),
        backupPath: backupPath,
        size: stats.size,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    next(error);
  }
};

/**
 * List all available backups
 */
exports.listBackups = async (req, res, next) => {
  try {
    const backupDir = path.join(__dirname, '../../backups');

    if (!fs.existsSync(backupDir)) {
      return res.json({
        success: true,
        data: {
          backups: [],
          total: 0,
        },
      });
    }

    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sqlite'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
        };
      })
      .sort((a, b) => b.created - a.created);

    res.json({
      success: true,
      data: {
        backups: files,
        total: files.length,
      },
    });
  } catch (error) {
    console.error('List backups error:', error);
    next(error);
  }
};

/**
 * Download a specific backup
 */
exports.downloadBackup = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, '../../backups', filename);

    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid filename' },
      });
    }

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        error: { message: 'Backup file not found' },
      });
    }

    res.download(backupPath, filename);
  } catch (error) {
    console.error('Download backup error:', error);
    next(error);
  }
};

/**
 * Restore database from backup
 */
exports.restoreBackup = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, '../../backups', filename);
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid filename' },
      });
    }

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        error: { message: 'Backup file not found' },
      });
    }

    // Create a backup of current database before restoring
    if (fs.existsSync(dbPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const preRestoreBackup = path.join(
        path.dirname(backupPath),
        `pre_restore_backup_${timestamp}.sqlite`
      );
      fs.copyFileSync(dbPath, preRestoreBackup);
    }

    // Close database connections
    await sequelize.close();

    // Restore backup
    fs.copyFileSync(backupPath, dbPath);

    // Reconnect to database
    await sequelize.sync();

    res.json({
      success: true,
      message: 'Database restored successfully from backup',
      data: {
        restoredFrom: filename,
      },
    });
  } catch (error) {
    console.error('Restore backup error:', error);
    next(error);
  }
};

/**
 * Delete a backup file
 */
exports.deleteBackup = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, '../../backups', filename);

    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid filename' },
      });
    }

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        error: { message: 'Backup file not found' },
      });
    }

    fs.unlinkSync(backupPath);

    res.json({
      success: true,
      message: `Backup '${filename}' deleted successfully`,
    });
  } catch (error) {
    console.error('Delete backup error:', error);
    next(error);
  }
};

/**
 * Configure automatic backups (schedule)
 */
exports.setupAutoBackup = () => {
  const AUTO_BACKUP_ENABLED = process.env.AUTO_BACKUP_ENABLED === 'true';
  const AUTO_BACKUP_INTERVAL = parseInt(process.env.AUTO_BACKUP_INTERVAL_HOURS || '24') * 60 * 60 * 1000;

  if (AUTO_BACKUP_ENABLED) {
    console.log(`Auto-backup enabled: backing up every ${AUTO_BACKUP_INTERVAL / (60 * 60 * 1000)} hours`);

    setInterval(async () => {
      try {
        const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

        if (!fs.existsSync(dbPath)) {
          console.log('Database file not found, skipping auto-backup');
          return;
        }

        const backupDir = path.join(__dirname, '../../backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').substring(0, 19);
        const backupPath = path.join(backupDir, `auto_backup_${timestamp}.sqlite`);

        fs.copyFileSync(dbPath, backupPath);
        console.log(`Auto-backup created: ${backupPath}`);

        // Clean up old backups (keep last 10)
        const MAX_AUTO_BACKUPS = parseInt(process.env.MAX_AUTO_BACKUPS || '10');
        const backups = fs.readdirSync(backupDir)
          .filter(file => file.startsWith('auto_backup_') && file.endsWith('.sqlite'))
          .map(file => ({
            name: file,
            path: path.join(backupDir, file),
            time: fs.statSync(path.join(backupDir, file)).birthtime,
          }))
          .sort((a, b) => b.time - a.time);

        if (backups.length > MAX_AUTO_BACKUPS) {
          backups.slice(MAX_AUTO_BACKUPS).forEach(backup => {
            fs.unlinkSync(backup.path);
            console.log(`Deleted old auto-backup: ${backup.name}`);
          });
        }
      } catch (error) {
        console.error('Auto-backup error:', error);
      }
    }, AUTO_BACKUP_INTERVAL);
  }
};
