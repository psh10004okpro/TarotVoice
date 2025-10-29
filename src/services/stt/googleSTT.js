const speech = require('@google-cloud/speech');
const fs = require('fs');

class GoogleSTTService {
  constructor() {
    this.client = new speech.SpeechClient();
  }

  /**
   * Transcribe audio file using Google Cloud Speech-to-Text
   * @param {string} filePath - Path to audio file
   * @param {object} options - Additional options
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribe(filePath, options = {}) {
    try {
      const audioBytes = fs.readFileSync(filePath).toString('base64');

      const audio = {
        content: audioBytes,
      };

      const config = {
        encoding: options.encoding || 'MP3',
        sampleRateHertz: options.sampleRateHertz || 16000,
        languageCode: options.languageCode || 'ko-KR',
        enableAutomaticPunctuation: true,
        model: options.model || 'default',
      };

      const request = {
        audio,
        config,
      };

      const [response] = await this.client.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      return transcription;
    } catch (error) {
      console.error('Google STT Error:', error);
      throw new Error(`Google STT failed: ${error.message}`);
    }
  }

  /**
   * Streaming transcription (for real-time processing)
   * @param {ReadableStream} audioStream - Audio stream
   * @param {object} options - Additional options
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribeStream(audioStream, options = {}) {
    return new Promise((resolve, reject) => {
      const recognizeStream = this.client
        .streamingRecognize({
          config: {
            encoding: options.encoding || 'LINEAR16',
            sampleRateHertz: options.sampleRateHertz || 16000,
            languageCode: options.languageCode || 'ko-KR',
          },
          interimResults: false,
        })
        .on('error', reject)
        .on('data', data => {
          const transcription = data.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
          resolve(transcription);
        });

      audioStream.pipe(recognizeStream);
    });
  }
}

module.exports = new GoogleSTTService();
