const elevenlabsTTS = require('../services/tts/elevenlabsTTS');
const naverClovaTTS = require('../services/tts/naverClovaTTS');
const googleCloudTTS = require('../services/tts/googleCloudTTS');
const AudioFile = require('../models/AudioFile');
const { generateHash } = require('../utils/hash');
const fs = require('fs');
const path = require('path');

/**
 * Generate speech using specified TTS service with caching
 */
exports.generateSpeech = async (req, res, next) => {
  try {
    const { text, service = 'google', language = 'ko-KR' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: { message: 'Text is required' },
      });
    }

    // Voice configuration based on service
    const voiceConfig = {
      voiceId: req.body.voiceId,
      speaker: req.body.speaker,
      voiceName: req.body.voiceName,
      speed: req.body.speed,
      pitch: req.body.pitch,
      stability: req.body.stability,
    };

    // Generate hash for caching
    const hash = generateHash(text, service, voiceConfig.voiceId || voiceConfig.speaker || voiceConfig.voiceName, {
      language,
      ...voiceConfig,
    });

    // Check if audio already exists in cache
    let audioFile = await AudioFile.findOne({ where: { hash } });

    if (audioFile && fs.existsSync(audioFile.file_path)) {
      // Update play count
      audioFile.play_count += 1;
      audioFile.last_played_at = new Date();
      await audioFile.save();

      return res.json({
        success: true,
        data: {
          id: audioFile.id,
          text: audioFile.text,
          service: audioFile.service,
          cached: true,
          audioUrl: `/api/tts/audio/${audioFile.id}`,
          streamUrl: `/api/tts/stream/${audioFile.id}`,
        },
      });
    }

    // Generate new audio
    let filePath;
    const outputDir = process.env.CACHE_DIR || './uploads/cache';

    switch (service.toLowerCase()) {
      case 'elevenlabs':
        filePath = await elevenlabsTTS.generateSpeech(text, {
          voiceId: voiceConfig.voiceId,
          stability: voiceConfig.stability,
          outputPath: path.join(outputDir, `${hash}.mp3`),
        });
        break;

      case 'naver':
        filePath = await naverClovaTTS.generateSpeech(text, {
          speaker: voiceConfig.speaker || 'nara',
          speed: voiceConfig.speed || 0,
          pitch: voiceConfig.pitch || 0,
          outputPath: path.join(outputDir, `${hash}.mp3`),
        });
        break;

      case 'google':
        filePath = await googleCloudTTS.generateSpeech(text, {
          languageCode: language,
          voiceName: voiceConfig.voiceName,
          speakingRate: voiceConfig.speed || 1.0,
          pitch: voiceConfig.pitch || 0.0,
          outputPath: path.join(outputDir, `${hash}.mp3`),
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid service. Use "elevenlabs", "naver", or "google"' },
        });
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    // Save to database
    audioFile = await AudioFile.create({
      text,
      service,
      voice_id: voiceConfig.voiceId || voiceConfig.speaker || voiceConfig.voiceName,
      language,
      file_path: filePath,
      file_size: stats.size,
      format: 'mp3',
      hash,
      play_count: 1,
      last_played_at: new Date(),
    });

    res.json({
      success: true,
      data: {
        id: audioFile.id,
        text: audioFile.text,
        service: audioFile.service,
        cached: false,
        audioUrl: `/api/tts/audio/${audioFile.id}`,
        streamUrl: `/api/tts/stream/${audioFile.id}`,
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

    const audioFile = await AudioFile.findByPk(id);

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
    audioFile.last_played_at = new Date();
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
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000',
      });

      file.pipe(res);
    } else {
      // Send entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
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

    const audioFile = await AudioFile.findByPk(id);

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

    res.download(audioFile.file_path, `audio-${audioFile.id}.mp3`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get available voices for a service
 */
exports.getVoices = async (req, res, next) => {
  try {
    const { service } = req.params;

    let voices;

    switch (service.toLowerCase()) {
      case 'elevenlabs':
        voices = await elevenlabsTTS.getVoices();
        break;

      case 'naver':
        voices = naverClovaTTS.getAvailableSpeakers();
        break;

      case 'google':
        const language = req.query.language || 'ko-KR';
        voices = await googleCloudTTS.getVoices(language);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid service. Use "elevenlabs", "naver", or "google"' },
        });
    }

    res.json({
      success: true,
      data: {
        service,
        voices,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audio file info
 */
exports.getAudioInfo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const audioFile = await AudioFile.findByPk(id);

    if (!audioFile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Audio file not found' },
      });
    }

    res.json({
      success: true,
      data: audioFile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all cached audio files
 */
exports.listAudioFiles = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, service, language } = req.query;

    const where = {};
    if (service) where.service = service;
    if (language) where.language = language;

    const audioFiles = await AudioFile.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        items: audioFiles.rows,
        total: audioFiles.count,
        page: parseInt(page),
        totalPages: Math.ceil(audioFiles.count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};
