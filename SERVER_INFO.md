# 🌐 TarotVoice 서버 정보

마지막 업데이트: 2025-11-11

## 📡 프로덕션 서버

### 기본 정보
- **환경**: Production
- **플랫폼**: Railway
- **데이터베이스**: PostgreSQL
- **상태**: ✅ 운영 중
- **버전**: 1.0.0

### 서버 주소
**메인 URL**: https://web-production-7d833.up.railway.app

---

## 🔗 주요 엔드포인트

### 웹 인터페이스
| 항목 | URL | 설명 |
|------|-----|------|
| 관리자 패널 | https://web-production-7d833.up.railway.app/ | 오디오 파일 관리 웹 UI |
| 로그인 페이지 | https://web-production-7d833.up.railway.app/login | 인증 페이지 |
| API 문서 | https://web-production-7d833.up.railway.app/api | API 엔드포인트 목록 |
| Health Check | https://web-production-7d833.up.railway.app/health | 서버 상태 확인 |

### API 엔드포인트

#### STT (Speech-to-Text) API
```
Base URL: https://web-production-7d833.up.railway.app/api/stt

POST   /api/stt/transcribe    - 오디오를 텍스트로 변환
POST   /api/stt/translate     - 오디오를 영어로 번역
```

#### TTS (Text-to-Speech) API
```
Base URL: https://web-production-7d833.up.railway.app/api/tts

POST   /api/tts/generate           - 텍스트를 음성으로 변환
GET    /api/tts/stream/:id         - 오디오 스트리밍 (Range 지원)
GET    /api/tts/audio/:id          - 오디오 다운로드
GET    /api/tts/info/:id           - 오디오 정보 조회
GET    /api/tts/list               - 캐시된 파일 목록
GET    /api/tts/voices/:service    - 사용 가능한 음성 목록
```

#### Audio Manager API
```
Base URL: https://web-production-7d833.up.railway.app/api/audio-manager

POST   /api/audio-manager/upload        - 오디오 파일 업로드
GET    /api/audio-manager/list          - 파일 목록 (검색/페이징)
GET    /api/audio-manager/info/:id      - 파일 정보 조회
GET    /api/audio-manager/stream/:id    - 오디오 스트리밍
GET    /api/audio-manager/download/:id  - 오디오 다운로드
PUT    /api/audio-manager/update/:id    - 파일 정보 수정
DELETE /api/audio-manager/delete/:id    - 파일 삭제
GET    /api/audio-manager/statistics    - 통계 정보
```

#### Backup API
```
Base URL: https://web-production-7d833.up.railway.app/api/backup

POST   /api/backup/create                - 백업 생성
GET    /api/backup/list                  - 백업 목록
GET    /api/backup/download/:filename    - 백업 다운로드
POST   /api/backup/restore/:filename     - 백업 복원
DELETE /api/backup/delete/:filename      - 백업 삭제
```

---

## 🔐 인증 정보

### 접근 제어
- **인증 방식**: 비밀번호 기반 (환경 변수 `ACCESS_PASSWORD`)
- **세션 관리**: 쿠키 기반
- **보호 범위**:
  - ✅ 모든 API 엔드포인트 (`/api/*`)
  - ✅ 웹 관리자 패널 (`/`)
  - ❌ 로그인 페이지 (`/login`)
  - ❌ Health Check (`/health`)

### 로그인
```bash
# 로그인 API
curl -X POST https://web-production-7d833.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your_password"}'

# 로그아웃 API
curl -X POST https://web-production-7d833.up.railway.app/api/auth/logout
```

---

## 🧪 API 테스트 예제

### Health Check
```bash
curl https://web-production-7d833.up.railway.app/health
```

**응답 예시**:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-11-11T15:31:08.877Z"
}
```

### TTS 음성 생성 (인증 필요)
```bash
curl -X POST https://web-production-7d833.up.railway.app/api/tts/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=your_token" \
  -d '{
    "text": "안녕하세요",
    "service": "google",
    "language": "ko-KR",
    "voiceName": "ko-KR-Standard-A"
  }'
```

### 오디오 파일 업로드 (인증 필요)
```bash
curl -X POST https://web-production-7d833.up.railway.app/api/audio-manager/upload \
  -H "Cookie: auth_token=your_token" \
  -F "audio=@/path/to/audio.mp3" \
  -F "id=my_audio_01" \
  -F "title=My Audio Title" \
  -F "description=Audio description"
```

### 오디오 스트리밍 (HTML5)
```html
<audio controls>
  <source src="https://web-production-7d833.up.railway.app/api/audio-manager/stream/my_audio_01"
          type="audio/mpeg">
</audio>
```

---

## 📊 서버 사양

### Railway 설정
- **리전**: 자동 선택 (최적 위치)
- **인스턴스**: 단일 인스턴스
- **데이터베이스**: PostgreSQL (관리형)
- **스토리지**: Volume 마운트 (`/app/uploads`)
- **SSL/TLS**: 자동 제공
- **리버스 프록시**: Railway 제공 (trust proxy 활성화)

### 리소스
- **CPU**: 공유
- **메모리**: 512MB~1GB
- **디스크**: 볼륨 설정에 따라 다름
- **네트워크**: 무제한

### 보안
- ✅ Helmet (보안 헤더)
- ✅ CORS 활성화
- ✅ Rate Limiting (IP당 15분에 100회)
- ✅ Compression 활성화
- ✅ HTTPS 강제

---

## 🔧 환경 변수 (현재 설정)

프로덕션 서버에 설정된 주요 환경 변수:

```env
# 서버 설정
NODE_ENV=production
PORT=3000

# 인증
ACCESS_PASSWORD=[설정됨]

# 데이터베이스
DATABASE_URL=[Railway 자동 제공]

# AI 서비스 (설정된 항목만)
GOOGLE_CREDENTIALS_JSON=[설정됨]
OPENAI_API_KEY=[설정됨]
ELEVENLABS_API_KEY=[설정됨]
NAVER_CLIENT_ID=[설정됨]
NAVER_CLIENT_SECRET=[설정됨]

# 백업 설정
AUTO_BACKUP_ENABLED=false  # PostgreSQL 자동 백업 사용
```

---

## 📈 모니터링

### Railway 대시보드
- **URL**: https://railway.app/project/[project-id]
- **모니터링 항목**:
  - 실시간 로그
  - CPU/메모리 사용률
  - 네트워크 트래픽
  - 배포 히스토리
  - 환경 변수 관리

### 로그 확인
```bash
# Railway CLI 사용 시
railway logs
railway logs --follow
```

### 서버 재시작
Railway 대시보드 → Settings → Restart Service

---

## 🚀 배포 정보

### Git 저장소
- **리포지토리**: https://github.com/psh10004okpro/TarotVoice
- **현재 브랜치**: claude/analyze-and-organize-code-011CUwmiPyoA9PiwWbmrphez
- **자동 배포**: GitHub 푸시 시 자동 배포

### 배포 히스토리
최근 배포 내역:
1. Fix API authentication: support cookie-based auth for web UI
2. Add Express trust proxy setting for Railway reverse proxy
3. Fix authentication: prioritize route handlers over static middleware
4. Add password authentication for API and web UI security

### 배포 프로세스
```bash
# 1. 코드 수정
git add .
git commit -m "Update feature"

# 2. GitHub에 푸시
git push origin main

# 3. Railway 자동 배포
# Railway가 자동으로 감지하고 재배포
```

---

## 📞 지원 및 문제 해결

### 서버 문제 발생 시
1. **Health Check 확인**: `/health` 엔드포인트 확인
2. **Railway 로그 확인**: 대시보드에서 실시간 로그 확인
3. **서비스 재시작**: Railway 대시보드에서 재시작
4. **환경 변수 확인**: 필수 변수가 설정되어 있는지 확인

### 연락처
- **GitHub Issues**: https://github.com/psh10004okpro/TarotVoice/issues
- **Railway 지원**: https://railway.app/help

---

## 📝 추가 문서

- [README.md](./README.md) - 프로젝트 개요 및 설치 가이드
- [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - Railway 배포 가이드
- [CLOUDFLARE_R2_SETUP.md](./CLOUDFLARE_R2_SETUP.md) - Cloudflare R2 설정 가이드

---

**마지막 상태 확인**: 2025-11-11 15:31 (UTC)
**서버 상태**: ✅ 정상 작동 중
