# TarotVoice 기술 문서 (Technical Documentation)

**버전**: 1.0.0
**마지막 업데이트**: 2025-11-11
**프로덕션 서버**: https://web-production-7d833.up.railway.app

---

## 📑 목차

1. [시스템 개요](#시스템-개요)
2. [아키텍처](#아키텍처)
3. [데이터베이스 설계](#데이터베이스-설계)
4. [외부 서비스 연동](#외부-서비스-연동)
5. [보안 시스템](#보안-시스템)
6. [캐싱 시스템](#캐싱-시스템)
7. [API 상세 명세](#api-상세-명세)
8. [파일 시스템](#파일-시스템)
9. [에러 처리](#에러-처리)
10. [배포 및 운영](#배포-및-운영)

---

## 시스템 개요

### 프로젝트 정보
- **이름**: TarotVoice Audio Streaming API Server
- **목적**: STT/TTS 서비스를 제공하는 종합 오디오 스트리밍 API
- **언어**: Node.js (JavaScript)
- **프레임워크**: Express.js
- **코드 라인**: 약 1,941 줄

### 핵심 기능
1. **음성-텍스트 변환 (STT)**
   - Google Cloud Speech-to-Text
   - OpenAI Whisper API

2. **텍스트-음성 변환 (TTS)**
   - Google Cloud Text-to-Speech
   - ElevenLabs
   - Naver Clova TTS

3. **오디오 파일 관리**
   - 커스텀 ID 기반 파일 관리
   - 웹 기반 관리자 패널
   - Range 기반 스트리밍

4. **데이터베이스 백업**
   - 자동/수동 백업
   - 복원 기능

### 기술 스택

#### Backend
```
Runtime: Node.js 18+
Framework: Express.js 4.18.2
ORM: Sequelize 6.35.2
Database: SQLite (dev) / PostgreSQL (prod)
```

#### 주요 라이브러리
```javascript
{
  // 보안
  "helmet": "7.1.0",           // 보안 헤더
  "cors": "2.8.5",             // CORS 처리
  "express-rate-limit": "7.1.5", // Rate limiting
  "cookie-parser": "1.4.6",    // 쿠키 파싱

  // 파일 처리
  "multer": "1.4.5-lts.1",     // 파일 업로드
  "compression": "1.7.4",       // 응답 압축

  // AI 서비스
  "@google-cloud/speech": "6.2.0",
  "@google-cloud/text-to-speech": "5.0.1",
  "openai": "4.24.1",
  "elevenlabs-node": "1.1.1",
  "axios": "1.6.2",

  // 데이터베이스
  "sequelize": "6.35.2",
  "pg": "8.16.3",              // PostgreSQL
  "sqlite3": "5.1.6",          // SQLite

  // 클라우드 스토리지
  "@aws-sdk/client-s3": "3.478.0", // Cloudflare R2

  // 유틸리티
  "dotenv": "16.3.1",
  "morgan": "1.10.0"           // 로깅
}
```

---

## 아키텍처

### 시스템 구조

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                   │
│         (Web UI, Mobile Apps, Third-party APIs)         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Railway Reverse Proxy                  │
│              (Load Balancing, SSL/TLS)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Express.js Server                     │
│  ┌────────────────────────────────────────────────┐    │
│  │  Middleware Layer                              │    │
│  │  - Helmet (Security)                           │    │
│  │  - CORS                                        │    │
│  │  - Rate Limiter                                │    │
│  │  - Authentication (Cookie/Header)              │    │
│  │  - Body Parser                                 │    │
│  │  - Error Handler                               │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Router Layer                                  │    │
│  │  - /api/stt (STT Routes)                       │    │
│  │  - /api/tts (TTS Routes)                       │    │
│  │  - /api/audio-manager (Audio Manager)          │    │
│  │  - /api/backup (Backup Routes)                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Controller Layer                              │    │
│  │  - sttController                               │    │
│  │  - ttsController                               │    │
│  │  - audioManagerController                      │    │
│  │  - backupController                            │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Service Layer                                 │    │
│  │  - Google STT/TTS                              │    │
│  │  - OpenAI Whisper                              │    │
│  │  - ElevenLabs TTS                              │    │
│  │  - Naver Clova TTS                             │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────┬───────────────┘
                      │                   │
         ┌────────────▼─────┐   ┌────────▼──────────┐
         │   PostgreSQL     │   │  File System      │
         │   (Railway)      │   │  (Volume Mount)   │
         │                  │   │  /app/uploads     │
         │  - audio_files   │   │  - /audio         │
         │  - managed_audio │   │  - /cache         │
         └──────────────────┘   └───────────────────┘
                      │
         ┌────────────▼─────────────┐
         │  External AI Services    │
         │  - Google Cloud          │
         │  - OpenAI API            │
         │  - ElevenLabs API        │
         │  - Naver API             │
         └──────────────────────────┘
```

### 디렉토리 구조

```
TarotVoice/
├── src/
│   ├── config/                      # 설정 파일
│   │   ├── database.js             # DB 연결 설정 (SQLite/PostgreSQL)
│   │   └── r2.js                   # Cloudflare R2 클라이언트
│   │
│   ├── models/                      # 데이터 모델 (Sequelize)
│   │   ├── AudioFile.js            # TTS 캐시 파일 모델
│   │   └── ManagedAudioFile.js     # 업로드 오디오 파일 모델
│   │
│   ├── controllers/                 # 비즈니스 로직
│   │   ├── sttController.js        # STT API 로직 (120 lines)
│   │   ├── ttsController.js        # TTS API 로직 (324 lines)
│   │   ├── audioManagerController.js # 오디오 관리 (380+ lines)
│   │   └── backupController.js     # 백업 관리 (240+ lines)
│   │
│   ├── routes/                      # 라우터
│   │   ├── sttRoutes.js            # STT 엔드포인트
│   │   ├── ttsRoutes.js            # TTS 엔드포인트
│   │   ├── audioManagerRoutes.js   # 오디오 관리 엔드포인트
│   │   └── backupRoutes.js         # 백업 엔드포인트
│   │
│   ├── services/                    # 외부 서비스 통합
│   │   ├── stt/
│   │   │   ├── googleSTT.js        # Google Cloud STT (80 lines)
│   │   │   └── whisperSTT.js       # OpenAI Whisper (57 lines)
│   │   └── tts/
│   │       ├── googleCloudTTS.js   # Google Cloud TTS (145 lines)
│   │       ├── elevenlabsTTS.js    # ElevenLabs TTS
│   │       └── naverClovaTTS.js    # Naver Clova TTS
│   │
│   ├── middleware/                  # 미들웨어
│   │   ├── auth.js                 # 인증 미들웨어 (99 lines)
│   │   ├── errorHandler.js         # 에러 핸들링 (32 lines)
│   │   ├── upload.js               # 로컬 파일 업로드
│   │   └── uploadR2.js             # R2 업로드
│   │
│   ├── utils/                       # 유틸리티
│   │   ├── hash.js                 # SHA-256 해시 생성 (18 lines)
│   │   └── googleCredentials.js    # Google 인증 헬퍼
│   │
│   └── server.js                    # 메인 서버 엔트리포인트 (198 lines)
│
├── public/                          # 정적 파일 (웹 UI)
│   ├── index.html                  # 관리자 패널 (5.6KB)
│   ├── login.html                  # 로그인 페이지 (5.9KB)
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
│
├── uploads/                         # 업로드 디렉토리 (git-ignored)
│   ├── audio/                      # 임시 업로드
│   └── cache/                      # TTS 캐시
│
├── backups/                         # DB 백업 (git-ignored)
├── database.sqlite                  # SQLite DB (git-ignored)
├── .env                             # 환경 변수 (git-ignored)
├── .env.example                     # 환경 변수 템플릿
├── package.json
├── Procfile                         # Railway 배포 설정
├── README.md
├── SERVER_INFO.md
├── TECHNICAL_DOCUMENTATION.md
├── RAILWAY_DEPLOYMENT.md
└── CLOUDFLARE_R2_SETUP.md
```

### 서버 시작 흐름

```javascript
// server.js 시작 프로세스
1. 환경 변수 로드 (dotenv)
2. Google Cloud 인증 설정
3. Express 앱 초기화
4. Trust Proxy 설정 (Railway)
5. 보안 미들웨어 적용
   - Helmet
   - CORS
   - Rate Limiting
6. Body Parser 설정
7. 로깅 설정 (Morgan)
8. 라우트 등록
   - 웹 UI 라우트 (/, /login)
   - API 라우트 (/api/*)
9. 에러 핸들러 등록
10. 데이터베이스 연결 및 동기화
11. 자동 백업 설정
12. HTTP 서버 시작 (포트 3000)
13. Graceful Shutdown 핸들러 등록
```

---

## 데이터베이스 설계

### 데이터베이스 전략

#### 개발 환경: SQLite
```javascript
// src/config/database.js
sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log,
  define: {
    timestamps: true,
    underscored: true  // created_at, updated_at
  }
});
```

#### 프로덕션 환경: PostgreSQL
```javascript
// Railway가 DATABASE_URL 자동 제공
sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,        // 최대 연결 수
    min: 0,        // 최소 연결 수
    acquire: 30000, // 연결 획득 타임아웃
    idle: 10000    // 유휴 연결 타임아웃
  }
});
```

### 테이블 스키마

#### 1. audio_files (TTS 캐시)

**목적**: TTS 생성 오디오를 캐싱하여 중복 요청 최적화

```sql
CREATE TABLE audio_files (
  id VARCHAR(36) PRIMARY KEY,           -- UUID v4
  text TEXT NOT NULL,                   -- 원본 텍스트
  service ENUM('elevenlabs', 'naver', 'google') NOT NULL,
  voice_id VARCHAR(255),                -- 음성 ID
  language VARCHAR(50) DEFAULT 'ko-KR',
  file_path VARCHAR(255) NOT NULL,      -- 파일 저장 경로
  file_size INTEGER,                    -- 파일 크기 (bytes)
  duration FLOAT,                       -- 오디오 길이 (초)
  format VARCHAR(10) DEFAULT 'mp3',
  hash VARCHAR(64) UNIQUE NOT NULL,     -- SHA-256 해시
  play_count INTEGER DEFAULT 0,         -- 재생 횟수
  last_played_at DATETIME,              -- 마지막 재생 시간
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- 인덱스
CREATE UNIQUE INDEX idx_audio_files_hash ON audio_files(hash);
CREATE INDEX idx_audio_files_service ON audio_files(service);
CREATE INDEX idx_audio_files_created ON audio_files(created_at);
```

**Sequelize 모델**:
```javascript
// src/models/AudioFile.js
const AudioFile = sequelize.define('AudioFile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  service: {
    type: DataTypes.ENUM('elevenlabs', 'naver', 'google'),
    allowNull: false
  },
  hash: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: 'Hash of text+service+voice_id for caching'
  },
  // ... 기타 필드
});
```

#### 2. managed_audio_files (업로드 오디오)

**목적**: 사용자가 업로드한 커스텀 오디오 파일 관리

```sql
CREATE TABLE managed_audio_files (
  id VARCHAR(255) PRIMARY KEY,          -- 사용자 정의 ID
  title VARCHAR(255) NOT NULL,          -- 파일 제목
  description TEXT,                     -- 설명
  file_path VARCHAR(255) NOT NULL,      -- 파일 저장 경로
  original_filename VARCHAR(255) NOT NULL,
  file_size INTEGER,                    -- 파일 크기 (bytes)
  duration FLOAT,                       -- 오디오 길이 (초)
  mime_type VARCHAR(100) DEFAULT 'audio/mpeg',
  format VARCHAR(10),                   -- 파일 확장자
  download_count INTEGER DEFAULT 0,     -- 다운로드 횟수
  play_count INTEGER DEFAULT 0,         -- 재생 횟수
  last_accessed_at DATETIME,            -- 마지막 접근 시간
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- 인덱스
CREATE UNIQUE INDEX idx_managed_audio_id ON managed_audio_files(id);
CREATE INDEX idx_managed_audio_created ON managed_audio_files(created_at);
```

**Sequelize 모델**:
```javascript
// src/models/ManagedAudioFile.js
const ManagedAudioFile = sequelize.define('ManagedAudioFile', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    comment: 'Custom ID provided by user'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // ... 기타 필드
});
```

### 데이터베이스 마이그레이션

```javascript
// 서버 시작 시 자동 동기화
await sequelize.sync({
  alter: process.env.NODE_ENV === 'development'
});

// 개발: 스키마 자동 변경
// 프로덕션: 수동 마이그레이션 권장
```

---

## 외부 서비스 연동

### 1. Google Cloud Services

#### Speech-to-Text (STT)
```javascript
// src/services/stt/googleSTT.js
const speech = require('@google-cloud/speech');
const client = new speech.SpeechClient();

// 인증 방법
// 1. 로컬: GOOGLE_APPLICATION_CREDENTIALS 환경 변수
// 2. 프로덕션: GOOGLE_CREDENTIALS_JSON (JSON 문자열)

async function transcribe(filePath, options) {
  const audio = {
    content: fs.readFileSync(filePath).toString('base64')
  };

  const config = {
    encoding: options.encoding || 'MP3',
    sampleRateHertz: 16000,
    languageCode: options.languageCode || 'ko-KR'
  };

  const [response] = await client.recognize({ audio, config });
  return response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
}
```

**지원 형식**:
- MP3, WAV, FLAC, OGG, WEBM
- 언어: 한국어, 영어, 일본어 등 125개 언어

#### Text-to-Speech (TTS)
```javascript
// src/services/tts/googleCloudTTS.js
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();

async function generateSpeech(text, options) {
  const request = {
    input: { text },
    voice: {
      languageCode: options.languageCode || 'ko-KR',
      name: options.voiceName || 'ko-KR-Standard-A',
      ssmlGender: 'NEUTRAL'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: options.speakingRate || 1.0,
      pitch: options.pitch || 0.0
    }
  };

  const [response] = await client.synthesizeSpeech(request);
  fs.writeFileSync(outputPath, response.audioContent, 'binary');
  return outputPath;
}
```

**음성 옵션**:
- 언어: 40개 이상 언어
- 음성 수: 220개 이상
- 음성 타입: Standard, WaveNet, Neural2

### 2. OpenAI Whisper (STT)

```javascript
// src/services/stt/whisperSTT.js
const OpenAI = require('openai');
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function transcribe(filePath, options) {
  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-1',
    language: options.language || 'ko',
    response_format: 'text',
    temperature: 0
  });

  return transcription;
}

async function translate(filePath) {
  // 모든 언어 → 영어 번역
  const translation = await client.audio.translations.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-1',
    response_format: 'text'
  });

  return translation;
}
```

**특징**:
- 다국어 지원 (99개 언어)
- 자동 언어 감지
- 높은 정확도
- 영어 번역 기능

### 3. ElevenLabs (TTS)

```javascript
// src/services/tts/elevenlabsTTS.js
const { ElevenLabsClient } = require('elevenlabs-node');
const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

async function generateSpeech(text, options) {
  const audio = await client.generate({
    voice: options.voiceId || 'EXAVITQu4vr4xnSDxMaL',
    text: text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: options.stability || 0.5,
      similarity_boost: options.similarityBoost || 0.75
    }
  });

  // 스트림을 파일로 저장
  const writeStream = fs.createWriteStream(outputPath);
  audio.pipe(writeStream);

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', reject);
  });
}
```

**특징**:
- 고품질 음성 합성
- 감정 표현 가능
- 사용자 정의 음성 생성
- 29개 언어 지원

### 4. Naver Clova TTS

```javascript
// src/services/tts/naverClovaTTS.js
const axios = require('axios');

async function generateSpeech(text, options) {
  const response = await axios.post(
    'https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts',
    `speaker=${options.speaker || 'nara'}&volume=0&speed=${options.speed || 0}&pitch=${options.pitch || 0}&format=mp3&text=${encodeURIComponent(text)}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': process.env.NAVER_CLIENT_SECRET
      },
      responseType: 'arraybuffer'
    }
  );

  fs.writeFileSync(outputPath, response.data);
  return outputPath;
}
```

**사용 가능한 화자**:
```javascript
const speakers = {
  nara: '여성 (차분한)',
  jinho: '남성 (차분한)',
  clara: '여성 (밝은)',
  matt: '남성 (밝은)',
  // ... 등등
};
```

### 5. Cloudflare R2 (선택적)

```javascript
// src/config/r2.js
const { S3Client } = require('@aws-sdk/client-s3');

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

// 공개 URL 생성
function getR2PublicUrl(key) {
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  return `https://${publicDomain}/${key}`;
}
```

**용도**: 오디오 파일 CDN 저장 (비용 절감 및 성능 향상)

---

## 보안 시스템

### 1. 인증 시스템

#### 인증 방식
```javascript
// src/middleware/auth.js

// 3가지 인증 방법 지원
1. Authorization Header: Bearer <password>
2. X-API-Key Header: <password>
3. Cookie: auth_token=<password>
```

#### API 인증 미들웨어
```javascript
const requireAuth = (req, res, next) => {
  const accessPassword = process.env.ACCESS_PASSWORD;

  // 비밀번호 미설정 시 인증 비활성화
  if (!accessPassword) {
    console.warn('⚠️  ACCESS_PASSWORD not set. API is publicly accessible!');
    return next();
  }

  // 헤더 또는 쿠키에서 인증 정보 확인
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  const authCookie = req.cookies?.auth_token;

  let providedPassword = null;

  if (authHeader?.startsWith('Bearer ')) {
    providedPassword = authHeader.substring(7);
  } else if (apiKey) {
    providedPassword = apiKey;
  } else if (authCookie) {
    providedPassword = authCookie;
  }

  // 비밀번호 검증
  if (providedPassword === accessPassword) {
    return next();
  }

  // 인증 실패
  return res.status(401).json({
    success: false,
    error: {
      message: 'Authentication required.',
      hint: 'Use Authorization: Bearer <password> or X-API-Key: <password>'
    }
  });
};
```

#### 웹 UI 인증 미들웨어
```javascript
const checkWebAuth = (req, res, next) => {
  const accessPassword = process.env.ACCESS_PASSWORD;

  if (!accessPassword) return next();

  // 정적 파일은 허용
  if (req.path.startsWith('/css/') || req.path.startsWith('/js/')) {
    return next();
  }

  const authCookie = req.cookies?.auth_token;

  if (authCookie === accessPassword) {
    return next();
  }

  // 미인증 시 로그인 페이지로 리다이렉트
  return res.redirect('/login');
};
```

#### 로그인 API
```javascript
// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const accessPassword = process.env.ACCESS_PASSWORD;

  if (password === accessPassword) {
    // 쿠키에 토큰 저장 (7일 유효)
    res.cookie('auth_token', password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      message: 'Login successful'
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid password'
  });
});
```

### 2. 보안 미들웨어

#### Helmet (보안 헤더)
```javascript
app.use(helmet({
  contentSecurityPolicy: false  // 웹 UI를 위해 인라인 스크립트 허용
}));

// 설정되는 보안 헤더:
// - X-DNS-Prefetch-Control
// - X-Frame-Options: DENY
// - X-Content-Type-Options: nosniff
// - X-XSS-Protection
// - Strict-Transport-Security
```

#### CORS
```javascript
app.use(cors());

// 모든 오리진 허용 (필요시 제한 가능)
// app.use(cors({
//   origin: ['https://yourdomain.com'],
//   credentials: true
// }));
```

#### Rate Limiting
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15분
  max: 100,                   // IP당 100회
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);
```

### 3. Trust Proxy 설정

```javascript
// Railway 리버스 프록시 지원
app.set('trust proxy', 1);

// 이를 통해:
// - req.ip에서 올바른 클라이언트 IP 획득
// - X-Forwarded-* 헤더 신뢰
// - Rate limiting 정확도 향상
```

### 4. 입력 검증

```javascript
// 파일 업로드 검증
const upload = multer({
  dest: './uploads/audio',
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 10485760  // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav',
                          'audio/ogg', 'audio/m4a', 'audio/webm'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files allowed.'));
    }
  }
});
```

---

## 캐싱 시스템

### SHA-256 해시 기반 캐싱

TTS 요청의 중복을 방지하기 위해 강력한 캐싱 메커니즘을 구현했습니다.

#### 해시 생성 로직
```javascript
// src/utils/hash.js
const crypto = require('crypto');

function generateHash(text, service, voiceId = '', additionalParams = {}) {
  const data = JSON.stringify({
    text: text.trim(),      // 공백 정규화
    service,                // 'google', 'naver', 'elevenlabs'
    voiceId,                // 음성 ID
    ...additionalParams     // 기타 파라미터 (언어, 속도 등)
  });

  return crypto.createHash('sha256').update(data).digest('hex');
}

// 예시:
// generateHash('안녕하세요', 'google', 'ko-KR-Standard-A', {language: 'ko-KR'})
// → '3f7a9b2c1d4e5f6...' (64자 해시)
```

#### 캐시 워크플로우

```javascript
// src/controllers/ttsController.js
exports.generateSpeech = async (req, res, next) => {
  const { text, service, language } = req.body;

  // 1. 해시 생성
  const hash = generateHash(text, service, voiceConfig.voiceId, {
    language,
    ...voiceConfig
  });

  // 2. 캐시 확인
  let audioFile = await AudioFile.findOne({ where: { hash } });

  if (audioFile && fs.existsSync(audioFile.file_path)) {
    // 캐시 히트: 기존 파일 반환
    audioFile.play_count += 1;
    audioFile.last_played_at = new Date();
    await audioFile.save();

    return res.json({
      success: true,
      data: {
        id: audioFile.id,
        text: audioFile.text,
        service: audioFile.service,
        cached: true,  // 캐시에서 제공됨
        audioUrl: `/api/tts/audio/${audioFile.id}`,
        streamUrl: `/api/tts/stream/${audioFile.id}`
      }
    });
  }

  // 3. 캐시 미스: 새로 생성
  const filePath = await generateNewAudio(text, service, options);

  // 4. DB에 저장
  audioFile = await AudioFile.create({
    text,
    service,
    voice_id: voiceConfig.voiceId,
    language,
    file_path: filePath,
    file_size: stats.size,
    format: 'mp3',
    hash,  // 해시 저장
    play_count: 1,
    last_played_at: new Date()
  });

  return res.json({
    success: true,
    data: {
      id: audioFile.id,
      cached: false,  // 새로 생성됨
      audioUrl: `/api/tts/audio/${audioFile.id}`,
      streamUrl: `/api/tts/stream/${audioFile.id}`
    }
  });
};
```

### 캐싱 효과

**시나리오**: 동일한 텍스트를 100번 요청

```
캐싱 없음:
- API 호출: 100회
- 비용: $1.00 (예시)
- 응답 시간: 100 x 2초 = 200초

캐싱 있음:
- API 호출: 1회 (첫 요청만)
- 비용: $0.01
- 응답 시간: 2초 + 99 x 0.1초 = 11.9초

절감:
- 비용: 99% 절감
- 응답 시간: 94% 단축
```

### 파일 저장 구조

```
uploads/cache/
├── 3f7a9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f.mp3
├── 4a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7.mp3
└── ...
```

**파일명 = 해시값**: 충돌 방지 및 빠른 검색

---

## API 상세 명세

### Range 기반 스트리밍

모든 오디오 스트리밍은 HTTP Range 요청을 지원하여 점진적 로딩을 가능하게 합니다.

#### 스트리밍 구현
```javascript
// src/controllers/ttsController.js
exports.streamAudio = async (req, res, next) => {
  const audioFile = await AudioFile.findByPk(req.params.id);
  const stat = fs.statSync(audioFile.file_path);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Range 요청 처리
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;

    const file = fs.createReadStream(audioFile.file_path, { start, end });

    res.writeHead(206, {  // Partial Content
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=31536000'  // 1년 캐싱
    });

    file.pipe(res);
  } else {
    // 전체 파일 전송
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=31536000'
    });

    fs.createReadStream(audioFile.file_path).pipe(res);
  }
};
```

#### 클라이언트 사용 예제

**HTML5 Audio Player**:
```html
<audio controls preload="metadata">
  <source src="https://web-production-7d833.up.railway.app/api/tts/stream/abc123"
          type="audio/mpeg">
</audio>
```

**JavaScript Fetch**:
```javascript
// Range 요청으로 일부만 다운로드
fetch('/api/tts/stream/abc123', {
  headers: {
    'Range': 'bytes=0-1023'  // 첫 1KB만
  }
})
.then(response => {
  console.log(response.status);  // 206 Partial Content
  return response.blob();
})
.then(blob => {
  const audio = new Audio(URL.createObjectURL(blob));
  audio.play();
});
```

### 에러 응답 형식

모든 API는 일관된 에러 형식을 반환합니다.

```javascript
// 성공 응답
{
  "success": true,
  "data": {
    // ... 결과 데이터
  }
}

// 에러 응답
{
  "success": false,
  "error": {
    "message": "오류 설명",
    "stack": "스택 트레이스 (개발 모드만)"
  }
}
```

**HTTP 상태 코드**:
```
200 - 성공
206 - Partial Content (Range 요청)
400 - Bad Request (잘못된 요청)
401 - Unauthorized (인증 필요)
404 - Not Found
429 - Too Many Requests (Rate limit 초과)
500 - Internal Server Error
```

---

## 파일 시스템

### 파일 저장 구조

```
uploads/
├── audio/              # 임시 업로드 (STT 처리 후 삭제)
│   └── temp-*.mp3
│
└── cache/              # TTS 캐시 (영구 저장)
    └── <hash>.mp3      # SHA-256 해시 파일명
```

### Railway 볼륨 마운트

프로덕션 환경에서는 파일 영속성을 위해 볼륨 마운트 사용:

```yaml
# Railway 설정
Volume Mount Path: /app/uploads
Volume Size: 1GB ~ 10GB
```

**중요**: Railway는 컨테이너가 재시작되면 로컬 파일이 삭제되므로, 볼륨 마운트가 필수입니다.

### 파일 정리 전략

```javascript
// 임시 파일 자동 정리
// src/controllers/sttController.js
try {
  // STT 처리
  const transcription = await whisperSTT.transcribe(filePath);

  // 성공 시 파일 삭제
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
} catch (error) {
  // 에러 시에도 파일 삭제
  if (req.file && fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path);
  }
  throw error;
}
```

**캐시 파일 관리**:
- TTS 캐시는 영구 보관
- 필요 시 수동으로 오래된 파일 정리
- 향후 구현 예정: TTL 기반 자동 정리

---

## 에러 처리

### 글로벌 에러 핸들러

```javascript
// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      // 개발 모드에서만 스택 트레이스 노출
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack
      })
    }
  });
};
```

### 404 핸들러

```javascript
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found'
    }
  });
};
```

### 에러 처리 패턴

**Controller 레벨**:
```javascript
exports.someAction = async (req, res, next) => {
  try {
    // 비즈니스 로직
    const result = await someService();
    res.json({ success: true, data: result });
  } catch (error) {
    // 에러를 글로벌 핸들러로 전달
    next(error);
  }
};
```

**Service 레벨**:
```javascript
async function generateSpeech(text, options) {
  try {
    const response = await externalAPI.call();
    return response;
  } catch (error) {
    console.error('Service Error:', error);
    // 의미 있는 에러 메시지로 변환
    throw new Error(`TTS failed: ${error.message}`);
  }
}
```

---

## 배포 및 운영

### 환경 변수

**필수 환경 변수**:
```env
# 서버
NODE_ENV=production
PORT=3000

# 인증 (선택적)
ACCESS_PASSWORD=your_secure_password

# 데이터베이스
DATABASE_URL=postgresql://...  # Railway 자동 제공
```

**AI 서비스 (사용하는 것만)**:
```env
# Google Cloud
GOOGLE_CREDENTIALS_JSON={"type":"service_account",...}

# OpenAI
OPENAI_API_KEY=sk-...

# ElevenLabs
ELEVENLABS_API_KEY=...

# Naver
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
```

### 로깅

```javascript
// Morgan 로그 형식
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  // :method :url :status :response-time ms
} else {
  app.use(morgan('combined'));
  // Apache combined 형식
}
```

### Graceful Shutdown

```javascript
// 안전한 서버 종료
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');

  // 데이터베이스 연결 종료
  await sequelize.close();

  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});
```

### 모니터링 포인트

**Health Check**:
```
GET /health
→ 서버 상태 및 타임스탬프 반환
```

**데이터베이스 연결**:
```javascript
await testConnection();
// 시작 시 DB 연결 테스트
```

**주요 메트릭**:
- 요청 수 (Morgan 로그)
- 응답 시간
- 캐시 히트율 (play_count 증가 패턴)
- 파일 저장소 사용량
- 데이터베이스 크기

---

## 성능 최적화

### 1. 캐싱 전략
- SHA-256 해시 기반 TTS 캐싱
- HTTP Cache-Control 헤더 (1년 캐싱)
- 데이터베이스 인덱스 최적화

### 2. 스트리밍
- Range 기반 HTTP 스트리밍
- 점진적 콘텐츠 로딩
- 낮은 초기 지연 시간

### 3. 압축
```javascript
app.use(compression());
// Gzip/Deflate 응답 압축
```

### 4. Connection Pooling
```javascript
pool: {
  max: 5,        // 최대 5개 동시 연결
  min: 0,
  acquire: 30000,
  idle: 10000
}
```

---

## 코드 품질

### 파일 크기 분석

```
src/
├── server.js                    198 lines   (핵심)
├── controllers/
│   ├── ttsController.js        324 lines   (TTS 로직)
│   ├── audioManagerController.js 380+ lines (파일 관리)
│   ├── backupController.js     240+ lines  (백업)
│   └── sttController.js        120 lines   (STT 로직)
├── services/
│   ├── tts/googleCloudTTS.js   145 lines
│   ├── stt/googleSTT.js         80 lines
│   └── stt/whisperSTT.js        57 lines
├── middleware/
│   ├── auth.js                  99 lines   (인증)
│   └── errorHandler.js          32 lines
└── utils/
    └── hash.js                  18 lines   (해시 생성)

총 코드 라인: ~1,941 lines
```

### 코드 컨벤션

- **네이밍**: camelCase (변수/함수), PascalCase (클래스)
- **비동기**: async/await 패턴 일관성
- **에러 처리**: try-catch + next(error) 패턴
- **주석**: JSDoc 스타일 함수 문서화

---

## 향후 개선 사항

### 계획된 기능
1. **캐시 TTL 시스템**: 오래된 TTS 캐시 자동 정리
2. **웹소켓 지원**: 실시간 STT 스트리밍
3. **다중 사용자 지원**: JWT 기반 인증
4. **분석 대시보드**: 사용 통계 시각화
5. **S3 통합 완성**: R2 외 AWS S3 지원

### 알려진 제약사항
1. **동시 요청 제한**: Rate limiter로 보호
2. **파일 크기 제한**: 기본 10MB
3. **언어 지원**: 주로 한국어/영어 최적화
4. **단일 인스턴스**: 수평 확장 미지원 (향후 계획)

---

## 문서 버전

- **v1.0.0** - 2025-11-11: 초기 기술 문서 작성
- 코드 베이스 커밋: `f53e299`

---

## 참조 문서

- [README.md](./README.md) - 사용자 가이드
- [SERVER_INFO.md](./SERVER_INFO.md) - 서버 정보
- [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - 배포 가이드
- [CLOUDFLARE_R2_SETUP.md](./CLOUDFLARE_R2_SETUP.md) - R2 설정

---

**작성자**: Claude Code
**저장소**: https://github.com/psh10004okpro/TarotVoice
**프로덕션**: https://web-production-7d833.up.railway.app
