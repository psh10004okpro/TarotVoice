# TarotVoice Audio Streaming API Server

A comprehensive audio streaming API server with Speech-to-Text (STT) and Text-to-Speech (TTS) services, featuring intelligent caching and real-time streaming capabilities.

## Features

- **Multiple STT Services**
  - Google Cloud Speech-to-Text
  - OpenAI Whisper API

- **Multiple TTS Services**
  - ElevenLabs
  - Naver Clova TTS
  - Google Cloud Text-to-Speech

- **Audio Streaming**
  - Range-based HTTP streaming
  - Client-side caching support
  - Automatic file caching with hash-based deduplication

- **Database Integration**
  - SQLite database for audio file management
  - Automatic caching based on text+service+voice combinations
  - Play count and usage statistics

## Installation

### Prerequisites

- Node.js 14.x or higher
- npm or yarn
- API keys for the services you want to use

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd TarotVoice
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your API credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DB_PATH=./database.sqlite

# Google Cloud (for both STT and TTS)
GOOGLE_APPLICATION_CREDENTIALS=./path/to/google-credentials.json

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Naver Clova
NAVER_CLIENT_ID=your_naver_client_id_here
NAVER_CLIENT_SECRET=your_naver_client_secret_here
```

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Documentation

### Speech-to-Text (STT) APIs

#### Transcribe Audio

Convert audio file to text using Google STT or OpenAI Whisper.

```http
POST /api/stt/transcribe
Content-Type: multipart/form-data

Parameters:
- audio (file): Audio file (mp3, wav, ogg, m4a, webm)
- service (string): 'google' or 'whisper' (default: 'whisper')
- language (string): Language code (default: 'ko')

Response:
{
  "success": true,
  "data": {
    "transcription": "transcribed text here",
    "service": "whisper",
    "language": "ko"
  }
}
```

Example with curl:
```bash
curl -X POST http://localhost:3000/api/stt/transcribe \
  -F "audio=@/path/to/audio.mp3" \
  -F "service=whisper" \
  -F "language=ko"
```

#### Translate Audio

Translate audio to English using Whisper.

```http
POST /api/stt/translate
Content-Type: multipart/form-data

Parameters:
- audio (file): Audio file

Response:
{
  "success": true,
  "data": {
    "translation": "translated text in English",
    "service": "whisper"
  }
}
```

### Text-to-Speech (TTS) APIs

#### Generate Speech

Convert text to speech with automatic caching.

```http
POST /api/tts/generate
Content-Type: application/json

Body:
{
  "text": "변환할 텍스트",
  "service": "google",
  "language": "ko-KR",

  // Service-specific options:

  // For ElevenLabs:
  "voiceId": "EXAVITQu4vr4xnSDxMaL",
  "stability": 0.5,
  "similarityBoost": 0.75,

  // For Naver Clova:
  "speaker": "nara",
  "speed": 0,
  "pitch": 0,

  // For Google Cloud:
  "voiceName": "ko-KR-Standard-A",
  "speed": 1.0,
  "pitch": 0.0
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "text": "변환할 텍스트",
    "service": "google",
    "cached": false,
    "audioUrl": "/api/tts/audio/uuid",
    "streamUrl": "/api/tts/stream/uuid"
  }
}
```

Example with curl:
```bash
curl -X POST http://localhost:3000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "안녕하세요",
    "service": "google",
    "language": "ko-KR",
    "voiceName": "ko-KR-Standard-A"
  }'
```

#### Stream Audio

Stream audio file with range request support (for progressive playback).

```http
GET /api/tts/stream/:id
Headers:
- Range: bytes=0-1023 (optional)

Response:
- Status: 206 Partial Content (with range) or 200 OK
- Content-Type: audio/mpeg
- Cache-Control: public, max-age=31536000
- Stream of audio data
```

Example HTML5 Audio Player:
```html
<audio controls>
  <source src="http://localhost:3000/api/tts/stream/uuid" type="audio/mpeg">
</audio>
```

#### Download Audio

Download audio file.

```http
GET /api/tts/audio/:id

Response:
- Downloads the audio file
```

#### Get Audio Info

Get information about a cached audio file.

```http
GET /api/tts/info/:id

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "text": "original text",
    "service": "google",
    "voice_id": "ko-KR-Standard-A",
    "language": "ko-KR",
    "file_path": "/path/to/file.mp3",
    "file_size": 12345,
    "format": "mp3",
    "hash": "sha256hash",
    "play_count": 5,
    "last_played_at": "2024-01-01T00:00:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### List Audio Files

List all cached audio files with pagination.

```http
GET /api/tts/list?page=1&limit=20&service=google&language=ko-KR

Response:
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "totalPages": 5
  }
}
```

#### Get Available Voices

Get available voices for a TTS service.

```http
GET /api/tts/voices/:service?language=ko-KR

Parameters:
- service: 'elevenlabs', 'naver', or 'google'
- language: Language code (for Google only)

Response:
{
  "success": true,
  "data": {
    "service": "google",
    "voices": [...]
  }
}
```

## Client-Side Caching Implementation

The API is designed to work seamlessly with client-side caching. Here's how to implement it:

### JavaScript/TypeScript Example

```javascript
class AudioCache {
  constructor() {
    this.cache = new Map();
  }

  async getAudio(text, service, options = {}) {
    // Generate cache key
    const cacheKey = this.generateCacheKey(text, service, options);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Request from server
    const response = await fetch('http://localhost:3000/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, service, ...options })
    });

    const data = await response.json();

    // Store in cache
    this.cache.set(cacheKey, data.data);

    return data.data;
  }

  generateCacheKey(text, service, options) {
    return `${service}-${text}-${JSON.stringify(options)}`;
  }

  async playAudio(text, service, options = {}) {
    const audioData = await this.getAudio(text, service, options);

    const audio = new Audio(audioData.streamUrl);
    audio.play();

    return audio;
  }
}

// Usage
const audioCache = new AudioCache();
await audioCache.playAudio('안녕하세요', 'google', {
  language: 'ko-KR',
  voiceName: 'ko-KR-Standard-A'
});
```

### React Example

```jsx
import { useState, useEffect } from 'react';

function useAudioCache() {
  const [cache, setCache] = useState(new Map());

  const getAudio = async (text, service, options) => {
    const cacheKey = `${service}-${text}-${JSON.stringify(options)}`;

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const response = await fetch('http://localhost:3000/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, service, ...options })
    });

    const data = await response.json();
    setCache(new Map(cache.set(cacheKey, data.data)));

    return data.data;
  };

  return { getAudio };
}

// Usage in component
function AudioPlayer() {
  const { getAudio } = useAudioCache();
  const [audioUrl, setAudioUrl] = useState(null);

  const handlePlay = async () => {
    const audio = await getAudio('안녕하세요', 'google', {
      language: 'ko-KR'
    });
    setAudioUrl(audio.streamUrl);
  };

  return (
    <div>
      <button onClick={handlePlay}>Play Audio</button>
      {audioUrl && <audio src={audioUrl} controls autoPlay />}
    </div>
  );
}
```

## Service Configuration

### Google Cloud Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Cloud Speech-to-Text API and Cloud Text-to-Speech API
3. Create a service account and download credentials JSON
4. Set `GOOGLE_APPLICATION_CREDENTIALS` in `.env`

### OpenAI Whisper Setup

1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Set `OPENAI_API_KEY` in `.env`

### ElevenLabs Setup

1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Get API key from dashboard
3. Set `ELEVENLABS_API_KEY` in `.env`

### Naver Clova Setup

1. Register at [Naver Cloud Platform](https://www.ncloud.com/)
2. Create AI Naver API application
3. Get Client ID and Secret
4. Set `NAVER_CLIENT_ID` and `NAVER_CLIENT_SECRET` in `.env`

## Project Structure

```
TarotVoice/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── sttController.js     # STT endpoints logic
│   │   └── ttsController.js     # TTS endpoints logic
│   ├── models/
│   │   └── AudioFile.js         # Audio file database model
│   ├── routes/
│   │   ├── sttRoutes.js         # STT routes
│   │   └── ttsRoutes.js         # TTS routes
│   ├── services/
│   │   ├── stt/
│   │   │   ├── googleSTT.js     # Google STT service
│   │   │   └── whisperSTT.js    # Whisper STT service
│   │   └── tts/
│   │       ├── elevenlabsTTS.js # ElevenLabs TTS service
│   │       ├── naverClovaTTS.js # Naver Clova TTS service
│   │       └── googleCloudTTS.js# Google Cloud TTS service
│   ├── middleware/
│   │   ├── errorHandler.js      # Error handling middleware
│   │   └── upload.js            # File upload middleware
│   ├── utils/
│   │   └── hash.js              # Hash generation utility
│   └── server.js                # Main server file
├── uploads/
│   ├── audio/                   # Temporary uploaded audio
│   └── cache/                   # Cached TTS audio files
├── .env                         # Environment variables
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "stack": "Stack trace (development only)"
  }
}
```

Common HTTP status codes:
- `200` - Success
- `206` - Partial Content (streaming with range)
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per 15 minutes per IP address
- Applies to all `/api/*` endpoints

## Performance Optimization

1. **Caching**: Audio files are cached using SHA-256 hash of text+service+voice combination
2. **Streaming**: Range-based HTTP streaming for efficient audio delivery
3. **Compression**: Response compression enabled
4. **Database**: Indexed queries for fast lookups

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
