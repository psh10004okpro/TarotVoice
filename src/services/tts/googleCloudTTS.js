const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');
const util = require('util');

class GoogleCloudTTSService {
  constructor() {
    this.client = new textToSpeech.TextToSpeechClient();
  }

  /**
   * Generate speech using Google Cloud TTS
   * @param {string} text - Text to convert to speech
   * @param {object} options - Additional options
   * @returns {Promise<string>} - Path to generated audio file
   */
  async generateSpeech(text, options = {}) {
    try {
      const outputPath = options.outputPath || path.join(
        process.env.CACHE_DIR || './uploads/cache',
        `google-${Date.now()}.mp3`
      );

      const request = {
        input: { text },
        voice: {
          languageCode: options.languageCode || 'ko-KR',
          name: options.voiceName || 'ko-KR-Standard-A',
          ssmlGender: options.ssmlGender || 'NEUTRAL',
        },
        audioConfig: {
          audioEncoding: options.audioEncoding || 'MP3',
          speakingRate: options.speakingRate || 1.0,
          pitch: options.pitch || 0.0,
          volumeGainDb: options.volumeGainDb || 0.0,
          effectsProfileId: options.effectsProfileId || [],
        },
      };

      const [response] = await this.client.synthesizeSpeech(request);

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the binary audio content to file
      const writeFile = util.promisify(fs.writeFile);
      await writeFile(outputPath, response.audioContent, 'binary');

      return outputPath;
    } catch (error) {
      console.error('Google Cloud TTS Error:', error);
      throw new Error(`Google Cloud TTS failed: ${error.message}`);
    }
  }

  /**
   * Generate speech with SSML
   * @param {string} ssml - SSML text
   * @param {object} options - Additional options
   * @returns {Promise<string>} - Path to generated audio file
   */
  async generateSpeechWithSSML(ssml, options = {}) {
    try {
      const outputPath = options.outputPath || path.join(
        process.env.CACHE_DIR || './uploads/cache',
        `google-ssml-${Date.now()}.mp3`
      );

      const request = {
        input: { ssml },
        voice: {
          languageCode: options.languageCode || 'ko-KR',
          name: options.voiceName || 'ko-KR-Standard-A',
        },
        audioConfig: {
          audioEncoding: options.audioEncoding || 'MP3',
        },
      };

      const [response] = await this.client.synthesizeSpeech(request);

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const writeFile = util.promisify(fs.writeFile);
      await writeFile(outputPath, response.audioContent, 'binary');

      return outputPath;
    } catch (error) {
      console.error('Google Cloud TTS SSML Error:', error);
      throw new Error(`Google Cloud TTS SSML failed: ${error.message}`);
    }
  }

  /**
   * Get available voices
   * @param {string} languageCode - Language code (e.g., 'ko-KR')
   * @returns {Promise<Array>} - List of available voices
   */
  async getVoices(languageCode = 'ko-KR') {
    try {
      const [result] = await this.client.listVoices({ languageCode });
      return result.voices;
    } catch (error) {
      console.error('Google Cloud Get Voices Error:', error);
      throw new Error(`Failed to get voices: ${error.message}`);
    }
  }

  /**
   * Stream audio buffer for real-time playback
   * @param {string} text - Text to convert to speech
   * @param {object} options - Additional options
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async streamSpeech(text, options = {}) {
    try {
      const request = {
        input: { text },
        voice: {
          languageCode: options.languageCode || 'ko-KR',
          name: options.voiceName || 'ko-KR-Standard-A',
        },
        audioConfig: {
          audioEncoding: options.audioEncoding || 'MP3',
        },
      };

      const [response] = await this.client.synthesizeSpeech(request);
      return response.audioContent;
    } catch (error) {
      console.error('Google Cloud Streaming Error:', error);
      throw new Error(`Google Cloud streaming failed: ${error.message}`);
    }
  }
}

module.exports = new GoogleCloudTTSService();
