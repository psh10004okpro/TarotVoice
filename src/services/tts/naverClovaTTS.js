const axios = require('axios');
const fs = require('fs');
const path = require('path');

class NaverClovaTTSService {
  constructor() {
    this.clientId = process.env.NAVER_CLIENT_ID;
    this.clientSecret = process.env.NAVER_CLIENT_SECRET;
    this.baseUrl = 'https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts';
  }

  /**
   * Generate speech using Naver Clova TTS
   * @param {string} text - Text to convert to speech
   * @param {object} options - Additional options
   * @returns {Promise<string>} - Path to generated audio file
   */
  async generateSpeech(text, options = {}) {
    try {
      const outputPath = options.outputPath || path.join(
        process.env.CACHE_DIR || './uploads/cache',
        `naver-${Date.now()}.mp3`
      );

      // Naver Clova TTS voices:
      // Korean: nara, jinho, clara, matt, shinji, meow, loro, dain, etc.
      const speaker = options.speaker || 'nara';
      const speed = options.speed || 0; // -5 to 5
      const pitch = options.pitch || 0; // -5 to 5
      const format = options.format || 'mp3';

      const response = await axios({
        method: 'post',
        url: this.baseUrl,
        headers: {
          'X-NCP-APIGW-API-KEY-ID': this.clientId,
          'X-NCP-APIGW-API-KEY': this.clientSecret,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: new URLSearchParams({
          speaker,
          speed: speed.toString(),
          pitch: pitch.toString(),
          format,
          text,
        }),
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
      console.error('Naver Clova TTS Error:', error.response?.data || error.message);
      throw new Error(`Naver Clova TTS failed: ${error.message}`);
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
      const speaker = options.speaker || 'nara';
      const speed = options.speed || 0;
      const pitch = options.pitch || 0;
      const format = options.format || 'mp3';

      const response = await axios({
        method: 'post',
        url: this.baseUrl,
        headers: {
          'X-NCP-APIGW-API-KEY-ID': this.clientId,
          'X-NCP-APIGW-API-KEY': this.clientSecret,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: new URLSearchParams({
          speaker,
          speed: speed.toString(),
          pitch: pitch.toString(),
          format,
          text,
        }),
        responseType: 'stream',
      });

      return response.data;
    } catch (error) {
      console.error('Naver Clova Streaming Error:', error);
      throw new Error(`Naver Clova streaming failed: ${error.message}`);
    }
  }

  /**
   * Get available speakers
   * @returns {Array} - List of available speakers
   */
  getAvailableSpeakers() {
    return [
      { id: 'nara', name: '나라 (여성)', language: 'ko-KR' },
      { id: 'jinho', name: '진호 (남성)', language: 'ko-KR' },
      { id: 'clara', name: '클라라 (영어)', language: 'en-US' },
      { id: 'matt', name: '매트 (영어)', language: 'en-US' },
      { id: 'shinji', name: '신지 (일본어)', language: 'ja-JP' },
      { id: 'meow', name: '메오 (중국어)', language: 'zh-CN' },
      { id: 'loro', name: '로로 (스페인어)', language: 'es-ES' },
      { id: 'dain', name: '다인 (여성)', language: 'ko-KR' },
    ];
  }
}

module.exports = new NaverClovaTTSService();
