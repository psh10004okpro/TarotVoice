const googleSTT = require('../services/stt/googleSTT');
const whisperSTT = require('../services/stt/whisperSTT');
const fs = require('fs');

/**
 * Transcribe audio using specified STT service
 */
exports.transcribe = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No audio file provided' },
      });
    }

    const { service = 'whisper', language = 'ko' } = req.body;
    const filePath = req.file.path;

    let transcription;

    switch (service.toLowerCase()) {
      case 'google':
        transcription = await googleSTT.transcribe(filePath, {
          languageCode: language === 'ko' ? 'ko-KR' : language,
          encoding: getAudioEncoding(req.file.mimetype),
        });
        break;

      case 'whisper':
        transcription = await whisperSTT.transcribe(filePath, {
          language: language === 'ko' ? 'ko' : language,
        });
        break;

      default:
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid service. Use "google" or "whisper"' },
        });
    }

    // Clean up uploaded file after processing
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      data: {
        transcription,
        service,
        language,
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
 * Translate audio to English using Whisper
 */
exports.translate = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No audio file provided' },
      });
    }

    const filePath = req.file.path;
    const translation = await whisperSTT.translate(filePath);

    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      data: {
        translation,
        service: 'whisper',
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
 * Get audio encoding from MIME type
 */
function getAudioEncoding(mimeType) {
  const encodings = {
    'audio/mp3': 'MP3',
    'audio/mpeg': 'MP3',
    'audio/wav': 'LINEAR16',
    'audio/wave': 'LINEAR16',
    'audio/x-wav': 'LINEAR16',
    'audio/flac': 'FLAC',
    'audio/ogg': 'OGG_OPUS',
    'audio/webm': 'WEBM_OPUS',
  };

  return encodings[mimeType] || 'MP3';
}
