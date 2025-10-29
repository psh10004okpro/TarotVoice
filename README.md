# TarotVoice 오디오 스트리밍 API 서버

지능형 캐싱 및 실시간 스트리밍 기능을 갖춘 음성-텍스트 변환(STT)과 텍스트-음성 변환(TTS) 서비스를 제공하는 종합 오디오 스트리밍 API 서버입니다.

## 주요 기능

- **다중 STT 서비스**
  - Google Cloud Speech-to-Text
  - OpenAI Whisper API

- **다중 TTS 서비스**
  - ElevenLabs
  - Naver Clova TTS
  - Google Cloud Text-to-Speech

- **오디오 파일 관리 시스템**
  - 오디오 파일 관리를 위한 웹 기반 관리자 패널
  - 커스텀 ID 및 설명과 함께 오디오 파일 업로드
  - 오디오 파일 스트리밍 및 다운로드
  - 검색 및 필터 기능
  - 통계 대시보드

- **오디오 스트리밍**
  - Range 기반 HTTP 스트리밍
  - 클라이언트 측 캐싱 지원
  - 해시 기반 중복 제거를 통한 자동 파일 캐싱

- **데이터베이스 통합**
  - 오디오 파일 관리를 위한 SQLite 데이터베이스
  - 텍스트+서비스+음성 조합 기반 자동 캐싱
  - 재생 횟수 및 사용 통계

## 설치

### 사전 준비

- Node.js 14.x 이상
- npm 또는 yarn
- 사용하려는 서비스의 API 키

### 설정

1. 저장소 복제:
```bash
git clone <repository-url>
cd TarotVoice
```

2. 의존성 설치:
```bash
npm install
```

3. 환경 변수 설정:
```bash
cp .env.example .env
```

`.env` 파일을 API 자격 증명으로 수정:

```env
# 서버 설정
PORT=3000
NODE_ENV=development

# 데이터베이스
DB_PATH=./database.sqlite

# Google Cloud (STT 및 TTS 모두 사용)
GOOGLE_APPLICATION_CREDENTIALS=./path/to/google-credentials.json

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Naver Clova
NAVER_CLIENT_ID=your_naver_client_id_here
NAVER_CLIENT_SECRET=your_naver_client_secret_here

# 자동 백업 설정 (선택 사항)
AUTO_BACKUP_ENABLED=true
AUTO_BACKUP_INTERVAL_HOURS=24
MAX_AUTO_BACKUPS=10
```

4. 서버 시작:
```bash
# 자동 재로드가 있는 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

5. 관리자 패널 접속:
```
http://localhost:3000/
```

## 🚀 Railway로 배포

프로덕션 배포를 위해 Railway(권장 클라우드 플랫폼)로 배포:

### 빠른 시작

1. **GitHub에 푸시**
```bash
git push origin main
```

2. **Railway에 배포**
   - [railway.app](https://railway.app) 접속
   - "Start a New Project" 클릭
   - "Deploy from GitHub repo" 선택
   - 저장소 선택
   - Railway가 자동으로 감지하고 배포

3. **PostgreSQL 추가**
   - Railway 대시보드에서 "New" 클릭
   - "Database" → "PostgreSQL" 선택
   - 데이터베이스 URL이 자동으로 설정됨

4. **환경 변수 설정**
   - "Variables" 탭으로 이동
   - API 키 추가 (자세한 내용은 RAILWAY_DEPLOYMENT.md 참조)

5. **파일 저장소용 볼륨 추가**
   - "Settings" → "Volumes"로 이동
   - 마운트 경로와 함께 볼륨 추가: `/app/uploads`

**📖 자세한 배포 가이드**: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) 참조

### 데이터베이스 지원

- **개발**: SQLite (기본값, 설정 불필요)
- **프로덕션**: PostgreSQL (Railway에서 자동 제공)

애플리케이션은 `DATABASE_URL` 환경 변수를 기반으로 적절한 데이터베이스를 자동으로 감지하고 사용합니다.

### 비용
- **Railway**: 월 ~$5-10 (PostgreSQL + 호스팅 포함)
- **무료 평가판**: 신규 사용자에게 $5 크레딧

## 오디오 파일 관리 시스템

시스템에는 쉬운 오디오 파일 관리를 위한 웹 기반 관리자 패널이 포함되어 있습니다.

### 관리자 패널 접속

브라우저를 열고 `http://localhost:3000/`로 이동하여 오디오 파일 관리 인터페이스에 접속하세요.

### 기능

- **오디오 파일 업로드**: 커스텀 ID, 제목, 설명과 함께 오디오 파일 업로드
- **파일 탐색**: 검색 및 페이지네이션으로 업로드된 모든 오디오 파일 보기
- **오디오 재생**: 브라우저에서 직접 오디오 스트리밍
- **다운로드**: 오디오 파일을 기기에 다운로드
- **정보 수정**: 파일 제목 및 설명 업데이트
- **파일 삭제**: 시스템에서 파일 제거
- **통계**: 총 파일 수, 저장소 크기, 재생 횟수, 다운로드 횟수 보기

### 웹 인터페이스 사용

1. **파일 업로드**:
   - 고유 ID 입력 (영숫자, 밑줄, 하이픈만 허용)
   - 제목 입력
   - 선택적 설명 추가
   - 오디오 파일 선택 (MP3, WAV, OGG, M4A, WebM)
   - "Upload" 클릭

2. **파일 관리**:
   - 검색창을 사용하여 ID, 제목, 설명으로 파일 찾기
   - "Play" 클릭하여 오디오 스트리밍
   - "Download" 클릭하여 파일 저장
   - "Copy Stream URL" 클릭하여 직접 스트리밍 URL 가져오기
   - "Edit" 클릭하여 파일 정보 업데이트
   - "Delete" 클릭하여 파일 제거

3. **프로그래밍 방식으로 파일 접근**:
   ```javascript
   // 스트림 URL 형식
   http://localhost:3000/api/audio-manager/stream/{fileId}

   // 다운로드 URL 형식
   http://localhost:3000/api/audio-manager/download/{fileId}
   ```

## 데이터베이스 백업 및 보호

### SQLite 보호 조치

시스템은 SQLite 데이터베이스를 위한 여러 보호 계층을 구현합니다:

1. **Git Ignore**: 데이터베이스 파일(*.sqlite, *.db)은 버전 관리에서 자동으로 제외됨
2. **자동 백업**: 예약된 자동 백업 (설정 가능)
3. **수동 백업**: 주문형 백업을 위한 API 엔드포인트
4. **백업 저장소**: 모든 백업은 `/backups` 디렉토리에 저장됨 (git-ignored)

### 자동 백업 설정

`.env` 파일에서 자동 백업 활성화:

```env
AUTO_BACKUP_ENABLED=true          # 자동 백업 활성화/비활성화
AUTO_BACKUP_INTERVAL_HOURS=24     # 24시간마다 백업
MAX_AUTO_BACKUPS=10               # 최근 10개 자동 백업 유지
```

활성화되면 시스템은:
- 지정된 간격으로 자동 백업 생성
- 가장 최근 백업만 유지 (설정 가능)
- `/backups/auto_backup_YYYY-MM-DD_HH-MM-SS.sqlite`에 백업 저장

### 수동 백업 작업

백업 API 엔드포인트를 사용하여 백업을 수동으로 관리:

```bash
# 백업 생성
curl -X POST http://localhost:3000/api/backup/create

# 모든 백업 목록
curl http://localhost:3000/api/backup/list

# 백업 다운로드
curl -O http://localhost:3000/api/backup/download/database_backup_2024-01-01_12-00-00.sqlite

# 백업에서 복원
curl -X POST http://localhost:3000/api/backup/restore/database_backup_2024-01-01_12-00-00.sqlite

# 백업 삭제
curl -X DELETE http://localhost:3000/api/backup/delete/database_backup_2024-01-01_12-00-00.sqlite
```

### 프로덕션 데이터베이스로 확장

프로덕션 환경이나 대규모 배포의 경우 PostgreSQL 또는 MySQL로 마이그레이션 고려:

**장점:**
- 더 나은 동시 연결 처리
- 더 강력한 데이터 무결성
- 고급 기능 (전문 검색, JSON 지원)
- 전문적인 백업 도구
- 대규모에서 더 나은 성능

자세한 마이그레이션 지침은 `src/config/database-config.md`를 참조하세요.

## API 문서

### 음성-텍스트 변환(STT) API

#### 오디오 변환

Google STT 또는 OpenAI Whisper를 사용하여 오디오 파일을 텍스트로 변환합니다.

```http
POST /api/stt/transcribe
Content-Type: multipart/form-data

매개변수:
- audio (파일): 오디오 파일 (mp3, wav, ogg, m4a, webm)
- service (문자열): 'google' 또는 'whisper' (기본값: 'whisper')
- language (문자열): 언어 코드 (기본값: 'ko')

응답:
{
  "success": true,
  "data": {
    "transcription": "변환된 텍스트",
    "service": "whisper",
    "language": "ko"
  }
}
```

curl 예제:
```bash
curl -X POST http://localhost:3000/api/stt/transcribe \
  -F "audio=@/path/to/audio.mp3" \
  -F "service=whisper" \
  -F "language=ko"
```

#### 오디오 번역

Whisper를 사용하여 오디오를 영어로 번역합니다.

```http
POST /api/stt/translate
Content-Type: multipart/form-data

매개변수:
- audio (파일): 오디오 파일

응답:
{
  "success": true,
  "data": {
    "translation": "영어로 번역된 텍스트",
    "service": "whisper"
  }
}
```

### 텍스트-음성 변환(TTS) API

#### 음성 생성

자동 캐싱으로 텍스트를 음성으로 변환합니다.

```http
POST /api/tts/generate
Content-Type: application/json

본문:
{
  "text": "변환할 텍스트",
  "service": "google",
  "language": "ko-KR",

  // 서비스별 옵션:

  // ElevenLabs용:
  "voiceId": "EXAVITQu4vr4xnSDxMaL",
  "stability": 0.5,
  "similarityBoost": 0.75,

  // Naver Clova용:
  "speaker": "nara",
  "speed": 0,
  "pitch": 0,

  // Google Cloud용:
  "voiceName": "ko-KR-Standard-A",
  "speed": 1.0,
  "pitch": 0.0
}

응답:
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

curl 예제:
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

#### 오디오 스트리밍

Range 요청 지원과 함께 오디오 파일을 스트리밍합니다 (점진적 재생용).

```http
GET /api/tts/stream/:id
헤더:
- Range: bytes=0-1023 (선택 사항)

응답:
- 상태: 206 Partial Content (range 포함) 또는 200 OK
- Content-Type: audio/mpeg
- Cache-Control: public, max-age=31536000
- 오디오 데이터 스트림
```

HTML5 오디오 플레이어 예제:
```html
<audio controls>
  <source src="http://localhost:3000/api/tts/stream/uuid" type="audio/mpeg">
</audio>
```

#### 오디오 다운로드

오디오 파일을 다운로드합니다.

```http
GET /api/tts/audio/:id

응답:
- 오디오 파일 다운로드
```

#### 오디오 정보 가져오기

캐시된 오디오 파일에 대한 정보를 가져옵니다.

```http
GET /api/tts/info/:id

응답:
{
  "success": true,
  "data": {
    "id": "uuid",
    "text": "원본 텍스트",
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

#### 오디오 파일 목록

페이지네이션과 함께 캐시된 모든 오디오 파일을 나열합니다.

```http
GET /api/tts/list?page=1&limit=20&service=google&language=ko-KR

응답:
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

#### 사용 가능한 음성 가져오기

TTS 서비스의 사용 가능한 음성을 가져옵니다.

```http
GET /api/tts/voices/:service?language=ko-KR

매개변수:
- service: 'elevenlabs', 'naver', 또는 'google'
- language: 언어 코드 (Google만 해당)

응답:
{
  "success": true,
  "data": {
    "service": "google",
    "voices": [...]
  }
}
```

### 오디오 파일 관리 API

#### 오디오 파일 업로드

커스텀 ID 및 메타데이터와 함께 새 관리 오디오 파일을 업로드합니다.

```http
POST /api/audio-manager/upload
Content-Type: multipart/form-data

매개변수:
- audio (파일): 오디오 파일 (필수)
- id (문자열): 파일의 커스텀 ID (필수, 영숫자, 밑줄, 하이픈만)
- title (문자열): 오디오 파일의 제목 (필수)
- description (문자열): 오디오 파일의 설명 (선택 사항)

응답:
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

curl 예제:
```bash
curl -X POST http://localhost:3000/api/audio-manager/upload \
  -F "audio=@/path/to/audio.mp3" \
  -F "id=tarot_card_01" \
  -F "title=The Fool Card Reading" \
  -F "description=Tarot card reading for The Fool"
```

#### 오디오 파일 목록

검색 및 페이지네이션과 함께 모든 관리 오디오 파일 목록을 가져옵니다.

```http
GET /api/audio-manager/list?page=1&limit=10&search=tarot

쿼리 매개변수:
- page (숫자): 페이지 번호 (기본값: 1)
- limit (숫자): 페이지당 항목 수 (기본값: 50)
- search (문자열): ID, 제목, 설명으로 검색 (선택 사항)

응답:
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

#### 오디오 파일 정보 가져오기

특정 오디오 파일에 대한 자세한 정보를 가져옵니다.

```http
GET /api/audio-manager/info/:id

응답:
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

#### 오디오 파일 스트리밍

Range 요청 지원과 함께 오디오 파일을 스트리밍합니다.

```http
GET /api/audio-manager/stream/:id
헤더:
- Range: bytes=0-1023 (선택 사항)

응답:
- 상태: 206 Partial Content (range 포함) 또는 200 OK
- Content-Type: audio/mpeg (또는 적절한 mime type)
- 오디오 데이터 스트림
```

HTML 사용 예제:
```html
<audio controls>
  <source src="http://localhost:3000/api/audio-manager/stream/tarot_card_01" type="audio/mpeg">
</audio>
```

#### 오디오 파일 다운로드

오디오 파일을 다운로드합니다.

```http
GET /api/audio-manager/download/:id

응답:
- 원본 형식의 오디오 파일 다운로드
- 파일명: {id}.{format}
```

#### 오디오 파일 정보 업데이트

오디오 파일의 제목 및 설명을 업데이트합니다.

```http
PUT /api/audio-manager/update/:id
Content-Type: application/json

본문:
{
  "title": "업데이트된 제목",
  "description": "업데이트된 설명"
}

응답:
{
  "success": true,
  "data": {
    "id": "tarot_card_01",
    "title": "업데이트된 제목",
    "description": "업데이트된 설명",
    ...
  }
}
```

#### 오디오 파일 삭제

오디오 파일과 해당 ID를 시스템에서 삭제합니다.

```http
DELETE /api/audio-manager/delete/:id

응답:
{
  "success": true,
  "message": "Audio file 'tarot_card_01' has been deleted"
}
```

#### 통계 가져오기

모든 관리 오디오 파일에 대한 통계를 가져옵니다.

```http
GET /api/audio-manager/statistics

응답:
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

### 데이터베이스 백업 API

#### 백업 생성

데이터베이스의 수동 백업을 생성합니다.

```http
POST /api/backup/create

응답:
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

#### 백업 목록

사용 가능한 모든 백업 파일 목록을 가져옵니다.

```http
GET /api/backup/list

응답:
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

#### 백업 다운로드

특정 백업 파일을 다운로드합니다.

```http
GET /api/backup/download/:filename

예제:
GET /api/backup/download/database_backup_2024-01-01_12-00-00.sqlite

응답:
- 백업 파일 다운로드
```

#### 백업 복원

백업 파일에서 데이터베이스를 복원합니다.

```http
POST /api/backup/restore/:filename

예제:
POST /api/backup/restore/database_backup_2024-01-01_12-00-00.sqlite

응답:
{
  "success": true,
  "message": "Database restored successfully from backup",
  "data": {
    "restoredFrom": "database_backup_2024-01-01_12-00-00.sqlite"
  }
}
```

**중요 사항:**
- 복원하기 전에 현재 데이터베이스의 백업이 자동으로 생성됩니다
- 복원 중에 서버가 잠시 데이터베이스 연결을 끊고 다시 연결합니다
- 복원 프로세스 중에 모든 활성 연결이 닫힙니다

#### 백업 삭제

백업 파일을 삭제합니다.

```http
DELETE /api/backup/delete/:filename

예제:
DELETE /api/backup/delete/database_backup_2024-01-01_12-00-00.sqlite

응답:
{
  "success": true,
  "message": "Backup 'database_backup_2024-01-01_12-00-00.sqlite' deleted successfully"
}
```

## 클라이언트 측 캐싱 구현

API는 클라이언트 측 캐싱과 원활하게 작동하도록 설계되었습니다. 구현 방법은 다음과 같습니다:

### JavaScript/TypeScript 예제

```javascript
class AudioCache {
  constructor() {
    this.cache = new Map();
  }

  async getAudio(text, service, options = {}) {
    // 캐시 키 생성
    const cacheKey = this.generateCacheKey(text, service, options);

    // 먼저 캐시 확인
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 서버에 요청
    const response = await fetch('http://localhost:3000/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, service, ...options })
    });

    const data = await response.json();

    // 캐시에 저장
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

// 사용법
const audioCache = new AudioCache();
await audioCache.playAudio('안녕하세요', 'google', {
  language: 'ko-KR',
  voiceName: 'ko-KR-Standard-A'
});
```

### React 예제

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

// 컴포넌트에서 사용
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
      <button onClick={handlePlay}>오디오 재생</button>
      {audioUrl && <audio src={audioUrl} controls autoPlay />}
    </div>
  );
}
```

## 서비스 설정

### Google Cloud 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. Cloud Speech-to-Text API 및 Cloud Text-to-Speech API 활성화
3. 서비스 계정 생성 및 자격 증명 JSON 다운로드
4. `.env`에서 `GOOGLE_APPLICATION_CREDENTIALS` 설정

### OpenAI Whisper 설정

1. [OpenAI Platform](https://platform.openai.com/)에서 API 키 가져오기
2. `.env`에서 `OPENAI_API_KEY` 설정

### ElevenLabs 설정

1. [ElevenLabs](https://elevenlabs.io/)에서 가입
2. 대시보드에서 API 키 가져오기
3. `.env`에서 `ELEVENLABS_API_KEY` 설정

### Naver Clova 설정

1. [Naver Cloud Platform](https://www.ncloud.com/)에서 등록
2. AI Naver API 애플리케이션 생성
3. Client ID 및 Secret 가져오기
4. `.env`에서 `NAVER_CLIENT_ID` 및 `NAVER_CLIENT_SECRET` 설정

## 프로젝트 구조

```
TarotVoice/
├── src/
│   ├── config/
│   │   ├── database.js          # 데이터베이스 설정
│   │   └── r2.js                # R2 클라이언트 설정
│   ├── controllers/
│   │   ├── sttController.js     # STT 엔드포인트 로직
│   │   ├── ttsController.js     # TTS 엔드포인트 로직
│   │   ├── audioManagerController.js  # 오디오 관리 로직
│   │   └── backupController.js  # 백업 관리 로직
│   ├── models/
│   │   ├── AudioFile.js         # 오디오 파일 데이터베이스 모델
│   │   └── ManagedAudioFile.js  # 관리 오디오 파일 모델
│   ├── routes/
│   │   ├── sttRoutes.js         # STT 라우트
│   │   ├── ttsRoutes.js         # TTS 라우트
│   │   ├── audioManagerRoutes.js  # 오디오 관리 라우트
│   │   └── backupRoutes.js      # 백업 라우트
│   ├── services/
│   │   ├── stt/
│   │   │   ├── googleSTT.js     # Google STT 서비스
│   │   │   └── whisperSTT.js    # Whisper STT 서비스
│   │   └── tts/
│   │       ├── elevenlabsTTS.js # ElevenLabs TTS 서비스
│   │       ├── naverClovaTTS.js # Naver Clova TTS 서비스
│   │       └── googleCloudTTS.js# Google Cloud TTS 서비스
│   ├── middleware/
│   │   ├── errorHandler.js      # 오류 처리 미들웨어
│   │   ├── upload.js            # 파일 업로드 미들웨어
│   │   └── uploadR2.js          # R2 업로드 미들웨어
│   ├── utils/
│   │   └── hash.js              # 해시 생성 유틸리티
│   └── server.js                # 메인 서버 파일
├── public/
│   ├── index.html               # 웹 UI
│   ├── css/
│   │   └── styles.css           # 스타일시트
│   └── js/
│       └── app.js               # 프론트엔드 로직
├── uploads/
│   ├── audio/                   # 임시 업로드된 오디오
│   └── cache/                   # 캐시된 TTS 오디오 파일
├── backups/                     # 데이터베이스 백업
├── .env                         # 환경 변수
├── .env.example                 # 환경 변수 템플릿
├── .gitignore
├── package.json
├── railway.json                 # Railway 배포 설정
├── RAILWAY_DEPLOYMENT.md        # Railway 배포 가이드
├── CLOUDFLARE_R2_SETUP.md       # R2 설정 가이드
└── README.md
```

## 오류 처리

모든 API 엔드포인트는 일관된 오류 응답을 반환합니다:

```json
{
  "success": false,
  "error": {
    "message": "오류 설명",
    "stack": "스택 추적 (개발 전용)"
  }
}
```

일반적인 HTTP 상태 코드:
- `200` - 성공
- `206` - Partial Content (range로 스트리밍)
- `400` - Bad Request (잘못된 매개변수)
- `404` - Not Found
- `429` - Too Many Requests (속도 제한 초과)
- `500` - Internal Server Error

## 속도 제한

API는 남용을 방지하기 위해 속도 제한을 구현합니다:
- IP 주소당 15분에 100회 요청
- 모든 `/api/*` 엔드포인트에 적용

## 성능 최적화

1. **캐싱**: 텍스트+서비스+음성 조합의 SHA-256 해시를 사용하여 오디오 파일 캐싱
2. **스트리밍**: 효율적인 오디오 전송을 위한 Range 기반 HTTP 스트리밍
3. **압축**: 응답 압축 활성화
4. **데이터베이스**: 빠른 조회를 위한 인덱스 쿼리

## 기여

기여를 환영합니다! Pull Request를 자유롭게 제출해 주세요.

## 라이선스

MIT

## 지원

문제 및 질문은 GitHub에서 이슈를 열어주세요.
