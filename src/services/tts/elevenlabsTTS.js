const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ElevenLabsTTSService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  /**
   * Generate speech using ElevenLabs
   * @param {string} text - Text to convert to speech
   * @param {object} options - Additional options
   * @returns {Promise<string>} - Path to generated audio file
   */
  async generateSpeech(text, options = {}) {
    try {
      const voiceId = options.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default voice
      const outputPath = options.outputPath || path.join(
        process.env.CACHE_DIR || './uploads/cache',
        `elevenlabs-${Date.now()}.mp3`
      );

      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/text-to-speech/${voiceId}`,
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        data: {
          text,
          model_id: options.modelId || 'eleven_multilingual_v2',
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarityBoost || 0.75,
            style: options.style || 0.0,
            use_speaker_boost: options.useSpeakerBoost || true,
          },
        },
        responseType: 'stream',
      });

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Save the audio stream to file
      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(outputPath));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('ElevenLabs TTS Error:', error.response?.data || error.message);
      throw new Error(`ElevenLabs TTS failed: ${error.message}`);
    }
  }

  /**
   * Get available voices
   * @returns {Promise<Array>} - List of available voices
   */
  async getVoices() {
    try {
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/voices`,
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      return response.data.voices;
    } catch (error) {
      console.error('ElevenLabs Get Voices Error:', error);
      throw new Error(`Failed to get voices: ${error.message}`);
    }
  }

  /**
   * Stream speech in real-time
   * @param {string} text - Text to convert to speech
   * @param {object} options - Additional options
   * @returns {Promise<Stream>} - Audio stream
   */
  async streamSpeech(text, options = {}) {
    try {
      const voiceId = options.voiceId || 'EXAVITQu4vr4xnSDxMaL';

      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/text-to-speech/${voiceId}/stream`,
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        data: {
          text,
          model_id: options.modelId || 'eleven_multilingual_v2',
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarityBoost || 0.75,
          },
        },
        responseType: 'stream',
      });

      return response.data;
    } catch (error) {
      console.error('ElevenLabs Streaming Error:', error);
      throw new Error(`ElevenLabs streaming failed: ${error.message}`);
    }
  }
}

module.exports = new ElevenLabsTTSService();
