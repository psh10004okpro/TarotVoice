const ManagedAudioFile = require('../models/ManagedAudioFile');
const fs = require('fs');
const path = require('path');

/**
 * Upload a new managed audio file
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
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        error: { message: 'ID and title are required' },
      });
    }

    // Check if ID already exists
    const existing = await ManagedAudioFile.findByPk(id);
    if (existing) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        error: { message: 'An audio file with this ID already exists' },
      });
    }

    // Get file stats
    const stats = fs.statSync(req.file.path);
    const format = path.extname(req.file.originalname).slice(1).toLowerCase();

    // Create database entry
    const audioFile = await ManagedAudioFile.create({
      id,
      title,
      description: description || '',
      file_path: req.file.path,
      original_filename: req.file.originalname,
      file_size: stats.size,
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
        streamUrl: `/api/audio-manager/stream/${audioFile.id}`,
        downloadUrl: `/api/audio-manager/download/${audioFile.id}`,
        created_at: audioFile.created_at,
      },
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * Get list of all managed audio files
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

    res.json({
      success: true,
      data: {
        items: audioFiles.rows.map(file => ({
          ...file.toJSON(),
          streamUrl: `/api/audio-manager/stream/${file.id}`,
          downloadUrl: `/api/audio-manager/download/${file.id}`,
        })),
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

    res.json({
      success: true,
      data: {
        ...audioFile.toJSON(),
        streamUrl: `/api/audio-manager/stream/${audioFile.id}`,
        downloadUrl: `/api/audio-manager/download/${audioFile.id}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stream audio file
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

    if (!fs.existsSync(audioFile.file_path)) {
      return res.status(404).json({
        success: false,
        error: { message: 'Audio file does not exist on disk' },
      });
    }

    // Update play count
    audioFile.play_count += 1;
    audioFile.last_accessed_at = new Date();
    await audioFile.save();

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

    if (!fs.existsSync(audioFile.file_path)) {
      return res.status(404).json({
        success: false,
        error: { message: 'Audio file does not exist on disk' },
      });
    }

    // Update download count
    audioFile.download_count += 1;
    audioFile.last_accessed_at = new Date();
    await audioFile.save();

    // Set download filename
    const downloadFilename = `${audioFile.id}.${audioFile.format}`;

    res.download(audioFile.file_path, downloadFilename);
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

    res.json({
      success: true,
      data: {
        ...audioFile.toJSON(),
        streamUrl: `/api/audio-manager/stream/${audioFile.id}`,
        downloadUrl: `/api/audio-manager/download/${audioFile.id}`,
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

    // Delete file from disk
    if (fs.existsSync(audioFile.file_path)) {
      fs.unlinkSync(audioFile.file_path);
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
      },
    });
  } catch (error) {
    next(error);
  }
};
