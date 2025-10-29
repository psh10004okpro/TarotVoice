# Railway 배포 가이드

이 가이드는 TarotVoice API 서버를 Railway에 배포하는 과정을 단계별로 안내합니다.

## 📋 사전 준비

1. GitHub 계정
2. Railway 계정 (https://railway.app)
3. 코드가 GitHub 저장소에 푸시되어 있어야 함

## 🚀 배포 단계

### 1단계: GitHub에 코드 푸시

```bash
# 현재 변경사항 커밋
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2단계: Railway 프로젝트 생성

1. **Railway 접속**: https://railway.app 접속
2. **로그인**: GitHub 계정으로 로그인
3. **새 프로젝트**: "Start a New Project" 클릭
4. **GitHub 연결**: "Deploy from GitHub repo" 선택
5. **저장소 선택**: `TarotVoice` 저장소 선택
6. **브랜치 선택**: 배포할 브랜치 선택 (main 또는 현재 브랜치)

Railway가 자동으로 코드를 감지하고 배포를 시작합니다.

### 3단계: PostgreSQL 데이터베이스 추가

1. **프로젝트 대시보드**로 이동
2. **"New"** 버튼 클릭
3. **"Database"** 선택
4. **"Add PostgreSQL"** 클릭

Railway가 자동으로:
- PostgreSQL 인스턴스 생성
- `DATABASE_URL` 환경 변수 설정
- 앱과 데이터베이스 연결

### 4단계: 환경 변수 설정

프로젝트에서 **"Variables"** 탭으로 이동하여 다음 환경 변수들을 추가하세요:

#### 필수 환경 변수

```env
NODE_ENV=production
PORT=3000
```

#### Google Cloud 설정 (STT/TTS 사용 시)

**방법 1: JSON 환경 변수 (권장)**
```env
GOOGLE_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project",...전체 JSON...}
```

**방법 2: 개별 필드**
Google Cloud Console에서 서비스 계정 JSON을 다운로드한 후, 전체 내용을 복사하여 `GOOGLE_CREDENTIALS_JSON`에 붙여넣기

#### OpenAI Whisper (STT 사용 시)

```env
OPENAI_API_KEY=sk-...
```

#### ElevenLabs (TTS 사용 시)

```env
ELEVENLABS_API_KEY=...
```

#### Naver Clova (TTS 사용 시)

```env
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
```

#### 선택적 설정

```env
AUTO_BACKUP_ENABLED=false
MAX_FILE_SIZE=10485760
ALLOWED_AUDIO_FORMATS=mp3,wav,ogg,m4a,webm
```

> **참고**: Railway에서는 PostgreSQL이 자동 백업되므로 `AUTO_BACKUP_ENABLED=false` 권장

### 5단계: 볼륨(Volume) 추가 - 파일 저장용

음성 파일을 영구적으로 저장하기 위해 볼륨을 추가합니다:

1. **프로젝트 대시보드**에서 앱 서비스 클릭
2. **"Settings"** 탭으로 이동
3. **"Volumes"** 섹션 찾기
4. **"Add Volume"** 클릭
5. 다음 정보 입력:
   - **Mount Path**: `/app/uploads`
   - **Size**: 1GB (필요에 따라 조정)
6. **"Add"** 클릭

### 6단계: 배포 확인

1. **"Deployments"** 탭에서 배포 상태 확인
2. 로그를 통해 배포 진행 상황 모니터링
3. 배포 완료 후 생성된 URL 확인 (예: `https://tarotvoice-production.up.railway.app`)

### 7단계: 배포 테스트

생성된 URL로 API 테스트:

```bash
# Health check
curl https://your-app.up.railway.app/health

# API 정보
curl https://your-app.up.railway.app/api

# 관리자 패널
브라우저에서: https://your-app.up.railway.app/
```

## 🔧 배포 후 설정

### 커스텀 도메인 연결 (선택)

1. **"Settings"** 탭으로 이동
2. **"Domains"** 섹션 찾기
3. **"Custom Domain"** 클릭
4. 도메인 입력 (예: `api.tarotvoice.com`)
5. DNS 레코드 추가 (Railway가 안내 제공)

### 자동 배포 설정

Railway는 기본적으로 GitHub 푸시 시 자동 배포됩니다:

- `main` 브랜치에 푸시하면 자동으로 프로덕션 배포
- PR 생성 시 미리보기 환경 자동 생성 (선택 가능)

### 모니터링 설정

1. **"Metrics"** 탭에서 리소스 사용량 확인
2. CPU, 메모리, 네트워크 사용량 모니터링
3. 필요 시 플랜 업그레이드

## 📊 Railway 대시보드 주요 기능

### Deployments
- 배포 히스토리 확인
- 로그 실시간 확인
- 특정 버전으로 롤백

### Variables
- 환경 변수 관리
- 암호화된 변수 저장
- 서비스별 변수 구성

### Metrics
- CPU 사용률
- 메모리 사용량
- 네트워크 트래픽
- 요청 수

### Settings
- 볼륨 관리
- 도메인 설정
- 서비스 재시작
- 서비스 삭제

## 🐛 문제 해결

### 배포 실패

**증상**: 배포가 실패하고 에러 메시지 표시

**해결 방법**:
1. **"Deployments"** 탭에서 로그 확인
2. 에러 메시지 분석
3. 일반적인 원인:
   - 환경 변수 누락
   - 데이터베이스 연결 실패
   - 포트 설정 오류

```bash
# 로그에서 확인할 사항
- "Database connection established successfully" 메시지
- "Server running on port..." 메시지
- 에러 스택 트레이스
```

### 데이터베이스 연결 오류

**증상**: "Unable to connect to the database"

**해결 방법**:
1. PostgreSQL 서비스가 시작되었는지 확인
2. `DATABASE_URL` 환경 변수 확인
3. 데이터베이스와 앱이 같은 프로젝트에 있는지 확인

### 파일 업로드 실패

**증상**: 파일 업로드 후 재시작 시 파일 사라짐

**해결 방법**:
1. Volume이 추가되었는지 확인 (`/app/uploads`)
2. Volume 마운트 경로 확인
3. 서비스 재시작

### 환경 변수가 적용되지 않음

**해결 방법**:
1. 변수 저장 후 서비스 재시작
2. Railway 대시보드에서 "Restart" 클릭
3. 또는 GitHub에 빈 커밋 푸시:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

## 💰 비용 관리

### 무료 크레딧
- 신규 가입 시 $5 크레딧 제공
- 약 500시간 실행 가능

### 예상 월 비용
```
기본 서비스: $5/월
PostgreSQL: 포함 (500MB까지)
볼륨 (1GB): 포함
-------
총 예상: $5-10/월
```

### 비용 최적화 팁
1. **Auto-scaling 비활성화**: 일정한 트래픽이라면
2. **사용하지 않는 서비스 중지**: 개발 중단 시
3. **로그 레벨 조정**: 프로덕션에서는 에러만 로깅
4. **메트릭 모니터링**: 리소스 과다 사용 방지

## 🔒 보안 권장사항

### 환경 변수 보안
- ✅ API 키는 절대 코드에 하드코딩하지 않기
- ✅ Railway의 Variables 기능 사용
- ✅ 민감한 변수는 암호화됨

### 데이터베이스 보안
- ✅ Railway의 내부 네트워크 사용
- ✅ SSL 연결 자동 활성화
- ✅ 정기적인 백업 확인

### API 보안
- ✅ Rate limiting 활성화됨 (기본 설정)
- ✅ HTTPS 자동 적용
- ✅ CORS 설정 확인

## 📱 API 엔드포인트

배포 완료 후 다음 URL로 접근 가능:

```
메인 URL: https://your-app.up.railway.app
API 문서: https://your-app.up.railway.app/api
관리자 패널: https://your-app.up.railway.app/
Health Check: https://your-app.up.railway.app/health

STT API: https://your-app.up.railway.app/api/stt/...
TTS API: https://your-app.up.railway.app/api/tts/...
Audio Manager: https://your-app.up.railway.app/api/audio-manager/...
Backup API: https://your-app.up.railway.app/api/backup/...
```

## 🔄 업데이트 배포

코드 변경 후 배포:

```bash
# 변경사항 커밋
git add .
git commit -m "Update feature"

# GitHub에 푸시
git push origin main

# Railway가 자동으로 감지하고 재배포
```

배포 진행 상황은 Railway 대시보드의 "Deployments" 탭에서 확인할 수 있습니다.

## 📞 지원

### Railway 문서
- https://docs.railway.app

### 커뮤니티
- Discord: https://discord.gg/railway
- GitHub Discussions: https://github.com/railwayapp/railway/discussions

### 이 프로젝트 문제 보고
- GitHub Issues: 저장소의 Issues 탭

## ✅ 배포 체크리스트

배포 전:
- [ ] 코드를 GitHub에 푸시
- [ ] `.env.example` 파일 확인
- [ ] API 키 준비 (Google, OpenAI, ElevenLabs, Naver)

배포 중:
- [ ] Railway 프로젝트 생성
- [ ] PostgreSQL 추가
- [ ] 환경 변수 설정
- [ ] Volume 추가 (1GB)

배포 후:
- [ ] Health check 테스트
- [ ] API 엔드포인트 테스트
- [ ] 관리자 패널 접속 확인
- [ ] 파일 업로드 테스트
- [ ] 데이터베이스 연결 확인

---

**축하합니다!** 🎉 TarotVoice API 서버가 Railway에 성공적으로 배포되었습니다!
