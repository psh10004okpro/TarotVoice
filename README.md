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

- **Audio File Management System**
  - Web-based admin panel for managing audio files
  - Upload audio files with custom IDs and descriptions
  - Stream and download audio files
  - Search and filter capabilities
  - Statistics dashboard

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

# Automatic Backup Settings (Optional)
AUTO_BACKUP_ENABLED=true
AUTO_BACKUP_INTERVAL_HOURS=24
MAX_AUTO_BACKUPS=10
```

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

5. Access the admin panel:
```
http://localhost:3000/
```

## 🚀 Deployment to Railway

For production deployment to Railway (recommended cloud platform):

### Quick Start

1. **Push to GitHub**
```bash
git push origin main
```

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect and deploy

3. **Add PostgreSQL**
   - In Railway dashboard, click "New"
   - Select "Database" → "PostgreSQL"
   - Database URL will be automatically configured

4. **Configure Environment Variables**
   - Go to "Variables" tab
   - Add your API keys (see RAILWAY_DEPLOYMENT.md for details)

5. **Add Volume for File Storage**
   - Go to "Settings" → "Volumes"
   - Add volume with mount path: `/app/uploads`

**📖 Detailed deployment guide**: See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

### Database Support

- **Development**: SQLite (default, no setup required)
- **Production**: PostgreSQL (automatically provided by Railway)

The application automatically detects and uses the appropriate database based on the `DATABASE_URL` environment variable.

### Cost
- **Railway**: ~$5-10/month (includes PostgreSQL + hosting)
- **Free trial**: $5 credit for new users

## Audio File Management System

The system includes a web-based admin panel for easy audio file management.

### Access the Admin Panel

Open your browser and navigate to `http://localhost:3000/` to access the audio file management interface.

### Features

- **Upload Audio Files**: Upload audio files with custom IDs, titles, and descriptions
- **Browse Files**: View all uploaded audio files with search and pagination
- **Play Audio**: Stream audio directly in the browser
- **Download**: Download audio files to your device
- **Edit Info**: Update file titles and descriptions
- **Delete Files**: Remove files from the system
- **Statistics**: View total files, storage size, plays, and downloads

### Using the Web Interface

1. **Upload a File**:
   - Enter a unique ID (alphanumeric, underscore, hyphen only)
   - Provide a title
   - Add an optional description
   - Select an audio file (MP3, WAV, OGG, M4A, WebM)
   - Click "Upload"

2. **Manage Files**:
   - Use the search bar to find files by ID, title, or description
   - Click "Play" to stream audio
   - Click "Download" to save the file
   - Click "Copy Stream URL" to get the direct streaming URL
   - Click "Edit" to update file information
   - Click "Delete" to remove the file

3. **Access Files Programmatically**:
   ```javascript
   // Stream URL format
   http://localhost:3000/api/audio-manager/stream/{fileId}

   // Download URL format
   http://localhost:3000/api/audio-manager/download/{fileId}
   ```

## Database Backup & Protection

### SQLite Protection Measures

The system implements multiple layers of protection for your SQLite database:

1. **Git Ignore**: Database files (*.sqlite, *.db) are automatically excluded from version control
2. **Automatic Backups**: Scheduled automatic backups (configurable)
3. **Manual Backups**: API endpoints for on-demand backups
4. **Backup Storage**: All backups stored in `/backups` directory (also git-ignored)

### Automatic Backup Configuration

Enable automatic backups in your `.env` file:

```env
AUTO_BACKUP_ENABLED=true          # Enable/disable automatic backups
AUTO_BACKUP_INTERVAL_HOURS=24     # Backup every 24 hours
MAX_AUTO_BACKUPS=10               # Keep last 10 automatic backups
```

When enabled, the system will:
- Automatically create backups at specified intervals
- Keep only the most recent backups (configurable)
- Store backups in `/backups/auto_backup_YYYY-MM-DD_HH-MM-SS.sqlite`

### Manual Backup Operations

Use the backup API endpoints to manually manage backups:

```bash
# Create a backup
curl -X POST http://localhost:3000/api/backup/create

# List all backups
curl http://localhost:3000/api/backup/list

# Download a backup
curl -O http://localhost:3000/api/backup/download/database_backup_2024-01-01_12-00-00.sqlite

# Restore from backup
curl -X POST http://localhost:3000/api/backup/restore/database_backup_2024-01-01_12-00-00.sqlite

# Delete a backup
curl -X DELETE http://localhost:3000/api/backup/delete/database_backup_2024-01-01_12-00-00.sqlite
```

### Scaling to Production Databases

For production environments or larger scale deployments, consider migrating to PostgreSQL or MySQL:

**Benefits:**
- Better concurrent connection handling
- More robust data integrity
- Advanced features (full-text search, JSON support)
- Professional backup tools
- Better performance at scale

See `src/config/database-config.md` for detailed migration instructions.

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

### Audio File Management APIs

#### Upload Audio File

Upload a new managed audio file with custom ID and metadata.

```http
POST /api/audio-manager/upload
Content-Type: multipart/form-data

Parameters:
- audio (file): Audio file (required)
- id (string): Custom ID for the file (required, alphanumeric, underscore, hyphen only)
- title (string): Title of the audio file (required)
- description (string): Description of the audio file (optional)

Response:
{
  "success": true,
  "data": {
    "id": "tarot_card_01",
    "title": "The Fool Card Reading",
    "description": "Tarot card reading for The Fool",
    "format": "mp3",
    "file_size": 245678,
    "streamUrl": "/api/audio-manager/stream/tarot_card_01",
    "downloadUrl": "/api/audio-manager/download/tarot_card_01",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

Example with curl:
```bash
curl -X POST http://localhost:3000/api/audio-manager/upload \
  -F "audio=@/path/to/audio.mp3" \
  -F "id=tarot_card_01" \
  -F "title=The Fool Card Reading" \
  -F "description=Tarot card reading for The Fool"
```

#### List Audio Files

Get a list of all managed audio files with search and pagination.

```http
GET /api/audio-manager/list?page=1&limit=10&search=tarot

Query Parameters:
- page (number): Page number (default: 1)
- limit (number): Items per page (default: 50)
- search (string): Search by ID, title, or description (optional)

Response:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "tarot_card_01",
        "title": "The Fool Card Reading",
        "description": "Tarot card reading for The Fool",
        "original_filename": "fool.mp3",
        "file_size": 245678,
        "format": "mp3",
        "mime_type": "audio/mpeg",
        "download_count": 5,
        "play_count": 12,
        "last_accessed_at": "2024-01-01T00:00:00.000Z",
        "created_at": "2024-01-01T00:00:00.000Z",
        "streamUrl": "/api/audio-manager/stream/tarot_card_01",
        "downloadUrl": "/api/audio-manager/download/tarot_card_01"
      }
    ],
    "total": 50,
    "page": 1,
    "totalPages": 5
  }
}
```

#### Get Audio File Info

Get detailed information about a specific audio file.

```http
GET /api/audio-manager/info/:id

Response:
{
  "success": true,
  "data": {
    "id": "tarot_card_01",
    "title": "The Fool Card Reading",
    "description": "Tarot card reading for The Fool",
    "original_filename": "fool.mp3",
    "file_size": 245678,
    "format": "mp3",
    "mime_type": "audio/mpeg",
    "download_count": 5,
    "play_count": 12,
    "last_accessed_at": "2024-01-01T00:00:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z",
    "streamUrl": "/api/audio-manager/stream/tarot_card_01",
    "downloadUrl": "/api/audio-manager/download/tarot_card_01"
  }
}
```

#### Stream Audio File

Stream an audio file with range request support.

```http
GET /api/audio-manager/stream/:id
Headers:
- Range: bytes=0-1023 (optional)

Response:
- Status: 206 Partial Content (with range) or 200 OK
- Content-Type: audio/mpeg (or appropriate mime type)
- Stream of audio data
```

Example usage in HTML:
```html
<audio controls>
  <source src="http://localhost:3000/api/audio-manager/stream/tarot_card_01" type="audio/mpeg">
</audio>
```

#### Download Audio File

Download an audio file.

```http
GET /api/audio-manager/download/:id

Response:
- Downloads the audio file with original format
- Filename: {id}.{format}
```

#### Update Audio File Info

Update title and description of an audio file.

```http
PUT /api/audio-manager/update/:id
Content-Type: application/json

Body:
{
  "title": "Updated Title",
  "description": "Updated description"
}

Response:
{
  "success": true,
  "data": {
    "id": "tarot_card_01",
    "title": "Updated Title",
    "description": "Updated description",
    ...
  }
}
```

#### Delete Audio File

Delete an audio file and its ID from the system.

```http
DELETE /api/audio-manager/delete/:id

Response:
{
  "success": true,
  "message": "Audio file 'tarot_card_01' has been deleted"
}
```

#### Get Statistics

Get statistics about all managed audio files.

```http
GET /api/audio-manager/statistics

Response:
{
  "success": true,
  "data": {
    "totalFiles": 50,
    "totalSize": 12345678,
    "totalDownloads": 234,
    "totalPlays": 567,
    "recentFiles": [
      {
        "id": "tarot_card_01",
        "title": "The Fool Card Reading",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "popularFiles": [
      {
        "id": "tarot_card_01",
        "title": "The Fool Card Reading",
        "play_count": 12,
        "download_count": 5
      }
    ]
  }
}
```

### Database Backup APIs

#### Create Backup

Create a manual backup of the database.

```http
POST /api/backup/create

Response:
{
  "success": true,
  "message": "Database backup created successfully",
  "data": {
    "backupFile": "database_backup_2024-01-01_12-00-00.sqlite",
    "backupPath": "/full/path/to/backups/database_backup_2024-01-01_12-00-00.sqlite",
    "size": 245678,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### List Backups

Get a list of all available backup files.

```http
GET /api/backup/list

Response:
{
  "success": true,
  "data": {
    "backups": [
      {
        "filename": "database_backup_2024-01-01_12-00-00.sqlite",
        "size": 245678,
        "created": "2024-01-01T12:00:00.000Z",
        "modified": "2024-01-01T12:00:00.000Z"
      },
      {
        "filename": "auto_backup_2024-01-01_00-00-00.sqlite",
        "size": 243210,
        "created": "2024-01-01T00:00:00.000Z",
        "modified": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 2
  }
}
```

#### Download Backup

Download a specific backup file.

```http
GET /api/backup/download/:filename

Example:
GET /api/backup/download/database_backup_2024-01-01_12-00-00.sqlite

Response:
- Downloads the backup file
```

#### Restore Backup

Restore the database from a backup file.

```http
POST /api/backup/restore/:filename

Example:
POST /api/backup/restore/database_backup_2024-01-01_12-00-00.sqlite

Response:
{
  "success": true,
  "message": "Database restored successfully from backup",
  "data": {
    "restoredFrom": "database_backup_2024-01-01_12-00-00.sqlite"
  }
}
```

**Important Notes:**
- Before restoring, a backup of the current database is automatically created
- The server will briefly disconnect and reconnect to the database during restoration
- All active connections will be closed during the restore process

#### Delete Backup

Delete a backup file.

```http
DELETE /api/backup/delete/:filename

Example:
DELETE /api/backup/delete/database_backup_2024-01-01_12-00-00.sqlite

Response:
{
  "success": true,
  "message": "Backup 'database_backup_2024-01-01_12-00-00.sqlite' deleted successfully"
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
