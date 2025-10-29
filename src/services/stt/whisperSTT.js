const OpenAI = require('openai');
const fs = require('fs');

class WhisperSTTService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Transcribe audio file using OpenAI Whisper
   * @param {string} filePath - Path to audio file
   * @param {object} options - Additional options
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribe(filePath, options = {}) {
    try {
      const transcription = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: options.model || 'whisper-1',
        language: options.language || 'ko',
        response_format: options.responseFormat || 'text',
        temperature: options.temperature || 0,
      });

      return transcription;
    } catch (error) {
      console.error('Whisper STT Error:', error);
      throw new Error(`Whisper STT failed: ${error.message}`);
    }
  }

  /**
   * Transcribe with translation to English
   * @param {string} filePath - Path to audio file
   * @param {object} options - Additional options
   * @returns {Promise<string>} - Translated text
   */
  async translate(filePath, options = {}) {
    try {
      const translation = await this.client.audio.translations.create({
        file: fs.createReadStream(filePath),
        model: options.model || 'whisper-1',
        response_format: options.responseFormat || 'text',
      });

      return translation;
    } catch (error) {
      console.error('Whisper Translation Error:', error);
      throw new Error(`Whisper translation failed: ${error.message}`);
    }
  }
}

module.exports = new WhisperSTTService();
