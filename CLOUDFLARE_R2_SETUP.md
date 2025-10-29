# Cloudflare R2 설정 가이드

이 가이드는 TarotVoice API 서버에서 CDN 기반 오디오 파일 저장소로 Cloudflare R2를 설정하는 방법을 설명합니다.

## Cloudflare R2란?

Cloudflare R2는 S3 호환 객체 저장소 서비스로 다음과 같은 특징이 있습니다:
- **송신 비용 없음**: 대역폭/데이터 전송에 대한 요금 없음
- **글로벌 CDN**: 전 세계 Cloudflare 엣지 네트워크에서 파일 제공
- **S3 호환**: 기존 S3 도구 및 라이브러리와 호환
- **비용 효율적**: 10GB 무료 저장소, 이후 $0.015/GB/월

## Railway에서 R2를 사용하는 이유는?

Railway + R2로 배포할 때:
- **Railway 비용 절감**: R2 CDN에서 직접 파일 제공 (Railway 대역폭 사용 없음)
- **더 나은 성능**: Railway에서 직접 제공하는 것보다 Cloudflare 글로벌 CDN이 더 빠름
- **영구 저장소**: Railway의 파일 시스템은 임시적; R2는 영구 저장소 제공
- **확장성**: Railway 부하 없이 수천 개의 동시 스트림 처리

## 사전 준비

- Cloudflare 계정 (무료 요금제 제공)
- Railway 배포 (RAILWAY_DEPLOYMENT.md 참조)
- Cloudflare R2용 신용카드 (무료 요금제 제공, 초과하지 않는 한 청구 없음)

## 1단계: R2 버킷 생성

1. **Cloudflare 대시보드 로그인**
   - https://dash.cloudflare.com/ 접속
   - 왼쪽 사이드바에서 **R2**로 이동

2. **버킷 생성**
   - **"Create bucket"** 클릭
   - **버킷 이름**: `tarotvoice-audio` (또는 원하는 이름)
   - **위치**: 글로벌 배포를 위해 **"Automatic"** 선택
   - **"Create bucket"** 클릭

3. **공개 액세스 설정** (중요!)
   - 새로 생성된 버킷 클릭
   - **Settings** 탭으로 이동
   - **"Public Access"** 섹션으로 스크롤
   - **"Allow Access"** 또는 **"Connect Domain"** 클릭

   **옵션 A: R2.dev 서브도메인 (가장 쉬움)**
   - **"Allow Access"** 클릭
   - Cloudflare가 다음과 같은 공개 URL 제공: `https://tarotvoice-audio.1234567890abcdef.r2.dev`
   - 나중에 사용할 이 도메인 복사

   **옵션 B: 커스텀 도메인 (프로덕션 권장)**
   - **"Connect Domain"** 클릭
   - 도메인 입력: `cdn.yourdomain.com`
   - 안내에 따라 DNS 설정에 CNAME 레코드 추가
   - DNS 전파 대기 (보통 5-10분)

## 2단계: API 토큰 생성

1. **R2 API 토큰 생성**
   - R2 대시보드에서 **"Manage R2 API Tokens"** 클릭
   - **"Create API Token"** 클릭

2. **토큰 설정**
   - **토큰 이름**: `tarotvoice-api-server`
   - **권한**: **"Object Read & Write"** 선택
   - **TTL**: 비워두기 (만료 없음) 또는 필요에 따라 설정
   - **특정 버킷**: `tarotvoice-audio` 버킷 선택
   - **"Create API Token"** 클릭

3. **자격 증명 저장** (중요 - 한 번만 표시됨!)
   ```
   Access Key ID: abc123...
   Secret Access Key: xyz789...
   Account ID: 1234567890abcdef
   ```
   - **이 값들을 즉시 복사하세요** - 다시 볼 수 없습니다!

## 3단계: Railway 환경 변수 설정

1. **Railway 프로젝트로 이동**
   - Railway 프로젝트 대시보드 열기
   - **tarotvoice-api-server** 서비스 클릭
   - **Variables** 탭으로 이동

2. **R2 변수 추가**
   **"New Variable"**을 클릭하고 다음 각 변수를 추가하세요:

   ```bash
   # R2 저장소 활성화
   R2_ENABLED=true

   # R2 계정 ID (2단계에서 복사)
   R2_ACCOUNT_ID=1234567890abcdef

   # R2 액세스 키 ID (2단계에서 복사)
   R2_ACCESS_KEY_ID=abc123...

   # R2 시크릿 액세스 키 (2단계에서 복사)
   R2_SECRET_ACCESS_KEY=xyz789...

   # 버킷 이름 (1단계에서 설정)
   R2_BUCKET_NAME=tarotvoice-audio

   # 공개 도메인 (1단계에서 복사)
   # 옵션 A - R2.dev 서브도메인:
   R2_PUBLIC_DOMAIN=tarotvoice-audio.1234567890abcdef.r2.dev

   # 옵션 B - 커스텀 도메인:
   R2_PUBLIC_DOMAIN=cdn.yourdomain.com
   ```

3. **배포**
   - Railway가 새 환경 변수로 자동 재배포됨
   - 배포 완료 대기

## 4단계: 설정 확인

1. **서버 로그 확인**
   - Railway 대시보드에서 **Deployments**로 이동
   - 최신 배포 클릭
   - 로그에서 확인: `✓ Cloudflare R2 client initialized successfully`

2. **업로드 테스트**
   ```bash
   # 테스트 오디오 파일 업로드
   curl -X POST https://your-railway-app.up.railway.app/api/audio-manager/upload \
     -F "audio=@test.mp3" \
     -F "id=test-audio-001" \
     -F "title=Test Audio" \
     -F "description=Testing R2 upload"
   ```

3. **응답 확인**
   ```json
   {
     "message": "Audio file uploaded successfully",
     "audio": {
       "id": "test-audio-001",
       "streamUrl": "https://cdn.yourdomain.com/audio-1234567890-123456789.mp3",
       "storage": "r2"
     }
   }
   ```
   - **중요**: `storage`가 `"r2"`로 표시되어야 함 (`"local"`이 아님)
   - `streamUrl`이 R2 공개 도메인을 가리켜야 함

4. **스트리밍 테스트**
   - 응답에서 `streamUrl` 복사
   - 브라우저에서 열거나 curl 사용:
   ```bash
   curl -I https://cdn.yourdomain.com/audio-1234567890-123456789.mp3
   ```
   - 오디오 파일 헤더와 함께 `HTTP/2 200` 반환되어야 함

## 설정 옵션

### 로컬 폴백

R2가 설정되지 않았거나 연결에 실패하면 서버가 자동으로 로컬 저장소로 폴백됩니다:
- 파일이 `./uploads/audio/`에 저장됨
- Railway를 통해 제공됨 (Railway 대역폭 사용)
- 개발/테스트에 유용

R2를 비활성화하고 로컬 저장소 사용:
```bash
R2_ENABLED=false
```

### 하이브리드 방식

코드 변경 없이 R2와 로컬 저장소 간 전환 가능:
- **개발**: 로컬 저장소 사용 (`R2_ENABLED=false`)
- **프로덕션**: R2 사용 (`R2_ENABLED=true`)

### 커스텀 도메인 vs R2.dev

**R2.dev 서브도메인** (더 쉬움):
- ✓ 즉시 설정 (DNS 설정 불필요)
- ✓ 무료
- ✗ 일반적인 URL
- ✗ 일부 기업 방화벽에서 사용 불가

**커스텀 도메인** (권장):
- ✓ 전문적인 URL
- ✓ 더 나은 브랜딩
- ✓ 모든 곳에서 작동
- ✗ DNS 설정 필요
- ✗ DNS 전파에 5-10분 소요

## 비용 분석

### Cloudflare R2 요금
- **저장소**: 10GB 무료, 이후 $0.015/GB/월
- **Class A 작업** (쓰기): 100만 건 무료, 이후 $4.50/백만
- **Class B 작업** (읽기): 1000만 건 무료, 이후 $0.36/백만
- **송신**: **무료** (대역폭 요금 없음)

### 월별 비용 예시
1000개의 오디오 파일 (각 100MB):
- **저장소**: 100GB = 90GB × $0.015 = **$1.35**
- **업로드**: 1000개 파일 = 최소 비용
- **스트림**: 100,000 스트림 = 최소 비용 (Class B 작업)
- **대역폭**: 무제한 = **$0**
- **총계**: ~**$1.35/월**

Railway만 사용 시 비교:
- **대역폭**: 100GB 송신 × $0.10/GB = **$10/월**
- **R2 절감액**: 이 규모에서 월 ~$8.65

## 문제 해결

### "R2 client initialization failed"

**자격 증명 확인**:
```bash
# Railway 로그에서 찾기:
Error initializing R2 client: ...
```

**일반적인 문제**:
1. 잘못된 계정 ID 형식
2. 잘못된 액세스 키 ID 또는 시크릿 액세스 키
3. 버킷이 존재하지 않음
4. API 토큰에 쓰기 권한이 없음

**해결 방법**: 모든 환경 변수가 2단계 값과 일치하는지 재확인

### 파일 액세스 시 "403 Forbidden"

**문제**: 버킷이 공개되지 않음

**해결 방법**:
1. R2 대시보드 → 버킷 → Settings로 이동
2. 공개 액세스 활성화 (1단계 참조)
3. 올바른 공개 도메인을 사용하는지 확인

### 파일은 업로드되지만 액세스 불가

**문제**: 잘못된 `R2_PUBLIC_DOMAIN`

**해결 방법**:
1. R2 버킷의 공개 URL 확인
2. Railway 변수에서 `R2_PUBLIC_DOMAIN` 업데이트
3. 도메인에 `https://` **포함하지 말 것**
4. **올바름**: `cdn.yourdomain.com`
5. **잘못됨**: `https://cdn.yourdomain.com`

### 서버가 R2 대신 로컬 저장소 사용

**로그 확인**:
```bash
# 다음이 표시되어야 함:
✓ Cloudflare R2 client initialized successfully

# 다음이 표시되면:
⚠ Cloudflare R2 credentials not fully configured
```

**해결 방법**:
1. Railway 변수에서 `R2_ENABLED=true` 확인
2. 5개의 R2 변수가 모두 설정되었는지 확인
3. 서비스 재배포

### 커스텀 도메인이 작동하지 않음

**DNS가 아직 전파되지 않음**:
- CNAME 레코드 추가 후 5-10분 대기
- `dig cdn.yourdomain.com`으로 DNS 확인

**잘못된 CNAME 레코드**:
- R2 엔드포인트를 가리켜야 함 (Cloudflare 대시보드에 표시됨)
- 형식: `tarotvoice-audio.1234567890abcdef.r2.cloudflarestorage.com`

## 보안 모범 사례

1. **API 토큰 보안 유지**
   - 토큰을 git에 커밋하지 말 것
   - Railway 환경 변수에만 추가
   - 정기적으로 토큰 교체

2. **프로덕션에서 커스텀 도메인 사용**
   - 더 전문적
   - 더 나은 보안 (WAF 규칙 사용 가능)

3. **버킷 권한 올바르게 설정**
   - 오디오 파일에 대한 공개 읽기 활성화
   - API 토큰은 최소 권한으로 유지 (Object Read & Write만)

4. **사용량 모니터링**
   - R2 대시보드에서 저장소 사용량 확인
   - Cloudflare에서 청구 알림 설정

## 마이그레이션 가이드

### 기존 로컬 파일을 R2로 이동

이미 로컬 저장소에 파일이 있는 경우:

1. **Railway에서 모든 파일 다운로드**
   ```bash
   # API를 사용하여 모든 파일 목록 가져오기
   curl https://your-app.railway.app/api/audio-manager/list?limit=1000 > files.json

   # 각 파일 다운로드
   # (파일 목록을 기반으로 스크립트 작성)
   ```

2. **R2로 재업로드**
   - 환경 변수에서 R2 활성화
   - 업로드 API를 통해 파일 다시 업로드
   - 시스템이 자동으로 R2 사용

3. **데이터베이스 업데이트**
   - 새 업로드가 새 R2 항목 생성
   - 이전 로컬 파일 레코드는 여전히 작동 (로컬 저장소에서 제공)
   - 중요한 파일을 재업로드하여 점진적으로 마이그레이션

### 프로덕션 전 테스트

1. **먼저 Railway에서 로컬 저장소로 테스트**
2. **테스트 버킷으로 R2 설정**: `tarotvoice-audio-test`
3. **테스트 파일 업로드 및 스트리밍 작동 확인**
4. **준비되면 프로덕션 버킷으로 전환**

## 다음 단계

- ✓ R2 설정 및 작동
- [ ] R2 사용량 모니터링 설정
- [ ] CDN 캐싱 규칙 구성 (선택 사항)
- [ ] 파일 만료 정책 설정 (선택 사항)
- [ ] R2에서 파일 백업 구현 (선택 사항)

## 지원

- **Cloudflare R2 문서**: https://developers.cloudflare.com/r2/
- **Railway 지원**: https://railway.app/help
- **API 서버 문제**: Railway 대시보드에서 서버 로그 확인
