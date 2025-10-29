const ManagedAudioFile = require('../models/ManagedAudioFile');
const fs = require('fs');
const path = require('path');
const { isR2Enabled, getR2PublicUrl, getR2Client } = require('../config/r2');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Upload a new managed audio file
 * Supports both Cloudflare R2 and local storage
 */
exports.uploadAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No audio file provided' },
      });
    }

    const { id, title, description } = req.body;

    if (!id || !title) {
      // Clean up uploaded file
      await cleanupFile(req.file);
      return res.status(400).json({
        success: false,
        error: { message: 'ID and title are required' },
      });
    }

    // Check if ID already exists
    const existing = await ManagedAudioFile.findByPk(id);
    if (existing) {
      // Clean up uploaded file
      await cleanupFile(req.file);
      return res.status(400).json({
        success: false,
        error: { message: 'An audio file with this ID already exists' },
      });
    }

    // Determine file path and public URL based on storage type
    let filePath, publicUrl, fileSize;
    const format = path.extname(req.file.originalname).slice(1).toLowerCase();

    if (isR2Enabled() && req.file.key) {
      // Using Cloudflare R2
      filePath = req.file.key; // Store the R2 key
      publicUrl = getR2PublicUrl(req.file.key);
      fileSize = req.file.size;
      console.log('File uploaded to R2:', req.file.key);
    } else {
      // Using local storage
      filePath = req.file.path;
      publicUrl = null; // Will be served by the API
      const stats = fs.statSync(req.file.path);
      fileSize = stats.size;
      console.log('File uploaded to local storage:', req.file.path);
    }

    // Create database entry
    const audioFile = await ManagedAudioFile.create({
      id,
      title,
      description: description || '',
      file_path: filePath,
      original_filename: req.file.originalname,
      file_size: fileSize,
      mime_type: req.file.mimetype,
      format,
    });

    res.status(201).json({
      success: true,
      data: {
        id: audioFile.id,
        title: audioFile.title,
        description: audioFile.description,
        format: audioFile.format,
        file_size: audioFile.file_size,
        streamUrl: publicUrl || `/api/audio-manager/stream/${audioFile.id}`,
        downloadUrl: publicUrl || `/api/audio-manager/download/${audioFile.id}`,
        storage: isR2Enabled() ? 'r2' : 'local',
        created_at: audioFile.created_at,
      },
    });
  } catch (error) {
    // Clean up file on error
    if (req.file) {
      await cleanupFile(req.file);
    }
    next(error);
  }
};

/**
 * List all managed audio files
 */
exports.listAudioFiles = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search } = req.query;

    const where = {};
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { id: { [Op.like]: `%${search}%` } },
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const audioFiles = await ManagedAudioFile.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['file_path'] },
    });

    const useR2 = isR2Enabled();

    res.json({
      success: true,
      data: {
        items: audioFiles.rows.map(file => {
          const fileJson = file.toJSON();
          if (useR2) {
            // For R2, use public URLs directly
            const publicUrl = getR2PublicUrl(file.file_path);
            return {
              ...fileJson,
              streamUrl: publicUrl,
              downloadUrl: publicUrl,
              storage: 'r2',
            };
          } else {
            // For local storage, use API endpoints
            return {
              ...fileJson,
              streamUrl: `/api/audio-manager/stream/${file.id}`,
              downloadUrl: `/api/audio-manager/download/${file.id}`,
              storage: 'local',
            };
          }
        }),
        total: audioFiles.count,
        page: parseInt(page),
        totalPages: Math.ceil(audioFiles.count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific audio file info
 */
exports.getAudioInfo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const audioFile = await ManagedAudioFile.findByPk(id, {
      attributes: { exclude: ['file_path'] },
    });

    if (!audioFile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Audio file not found' },
      });
    }

    const fileJson = audioFile.toJSON();
    const useR2 = isR2Enabled();

    if (useR2) {
      const publicUrl = getR2PublicUrl(audioFile.file_path);
      res.json({
        success: true,
        data: {
          ...fileJson,
          streamUrl: publicUrl,
          downloadUrl: publicUrl,
          storage: 'r2',
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          ...fileJson,
          streamUrl: `/api/audio-manager/stream/${audioFile.id}`,
          downloadUrl: `/api/audio-manager/download/${audioFile.id}`,
          storage: 'local',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Stream audio file
 * For R2: redirects to R2 public URL
 * For local: streams file from disk
 */
exports.streamAudio = async (req, res, next) => {
  try {
    const { id } = req.params;

    const audioFile = await ManagedAudioFile.findByPk(id);

    if (!audioFile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Audio file not found' },
      });
    }

    // Update play count
    audioFile.play_count += 1;
    audioFile.last_accessed_at = new Date();
    await audioFile.save();

    if (isR2Enabled()) {
      // Redirect to R2 public URL
      const publicUrl = getR2PublicUrl(audioFile.file_path);
      return res.redirect(publicUrl);
    } else {
      // Stream from local disk
      if (!fs.existsSync(audioFile.file_path)) {
        return res.status(404).json({
          success: false,
          error: { message: 'Audio file does not exist on disk' },
        });
      }

      const stat = fs.statSync(audioFile.file_path);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        // Handle range requests for streaming
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(audioFile.file_path, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': audioFile.mime_type,
          'Cache-Control': 'public, max-age=31536000',
        });

        file.pipe(res);
      } else {
        // Send entire file
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': audioFile.mime_type,
          'Cache-Control': 'public, max-age=31536000',
        });

        fs.createReadStream(audioFile.file_path).pipe(res);
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Download audio file
 */
exports.downloadAudio = async (req, res, next) => {
  try {
    const { id } = req.params;

    const audioFile = await ManagedAudioFile.findByPk(id);

    if (!audioFile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Audio file not found' },
      });
    }

    // Update download count
    audioFile.download_count += 1;
    audioFile.last_accessed_at = new Date();
    await audioFile.save();

    if (isR2Enabled()) {
      // Redirect to R2 public URL
      const publicUrl = getR2PublicUrl(audioFile.file_path);
      return res.redirect(publicUrl);
    } else {
      // Download from local disk
      if (!fs.existsSync(audioFile.file_path)) {
        return res.status(404).json({
          success: false,
          error: { message: 'Audio file does not exist on disk' },
        });
      }

      const downloadFilename = `${audioFile.id}.${audioFile.format}`;
      res.download(audioFile.file_path, downloadFilename);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update audio file info
 */
exports.updateAudioInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const audioFile = await ManagedAudioFile.findByPk(id);

    if (!audioFile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Audio file not found' },
      });
    }

    if (title) audioFile.title = title;
    if (description !== undefined) audioFile.description = description;

    await audioFile.save();

    const useR2 = isR2Enabled();
    const fileJson = audioFile.toJSON();

    res.json({
      success: true,
      data: {
        ...fileJson,
        streamUrl: useR2 ? getR2PublicUrl(audioFile.file_path) : `/api/audio-manager/stream/${audioFile.id}`,
        downloadUrl: useR2 ? getR2PublicUrl(audioFile.file_path) : `/api/audio-manager/download/${audioFile.id}`,
        storage: useR2 ? 'r2' : 'local',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete audio file
 */
exports.deleteAudio = async (req, res, next) => {
  try {
    const { id } = req.params;

    const audioFile = await ManagedAudioFile.findByPk(id);

    if (!audioFile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Audio file not found' },
      });
    }

    if (isR2Enabled()) {
      // Delete from R2
      const r2Client = getR2Client();
      const bucketName = process.env.R2_BUCKET_NAME;

      try {
        await r2Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: audioFile.file_path,
        }));
        console.log('File deleted from R2:', audioFile.file_path);
      } catch (error) {
        console.error('Error deleting file from R2:', error);
        // Continue with database deletion even if R2 delete fails
      }
    } else {
      // Delete from local disk
      if (fs.existsSync(audioFile.file_path)) {
        fs.unlinkSync(audioFile.file_path);
        console.log('File deleted from local storage:', audioFile.file_path);
      }
    }

    // Delete from database
    await audioFile.destroy();

    res.json({
      success: true,
      message: `Audio file '${id}' has been deleted`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get statistics
 */
exports.getStatistics = async (req, res, next) => {
  try {
    const { Op } = require('sequelize');

    const totalFiles = await ManagedAudioFile.count();

    const totalSize = await ManagedAudioFile.sum('file_size') || 0;

    const totalDownloads = await ManagedAudioFile.sum('download_count') || 0;

    const totalPlays = await ManagedAudioFile.sum('play_count') || 0;

    const recentFiles = await ManagedAudioFile.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'title', 'created_at'],
    });

    const popularFiles = await ManagedAudioFile.findAll({
      limit: 5,
      order: [['play_count', 'DESC']],
      attributes: ['id', 'title', 'play_count', 'download_count'],
    });

    res.json({
      success: true,
      data: {
        totalFiles,
        totalSize,
        totalDownloads,
        totalPlays,
        recentFiles,
        popularFiles,
        storage: isR2Enabled() ? 'r2' : 'local',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to clean up uploaded file
 */
async function cleanupFile(file) {
  if (isR2Enabled() && file.key) {
    // Delete from R2
    try {
      const r2Client = getR2Client();
      const bucketName = process.env.R2_BUCKET_NAME;
      await r2Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: file.key,
      }));
    } catch (error) {
      console.error('Error cleaning up R2 file:', error);
    }
  } else if (file.path && fs.existsSync(file.path)) {
    // Delete from local disk
    fs.unlinkSync(file.path);
  }
}
