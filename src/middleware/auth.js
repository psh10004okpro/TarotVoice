/**
 * 간단한 비밀번호 인증 미들웨어
 *
 * 환경 변수 ACCESS_PASSWORD로 비밀번호 설정
 * API 요청 시 헤더에 비밀번호 포함 필요:
 * - Authorization: Bearer <password>
 * - X-API-Key: <password>
 */

/**
 * API 엔드포인트 보호 미들웨어
 */
const requireAuth = (req, res, next) => {
  // 비밀번호가 설정되지 않은 경우 인증 비활성화
  const accessPassword = process.env.ACCESS_PASSWORD;

  if (!accessPassword) {
    // 비밀번호가 설정되지 않으면 모두 허용
    console.warn('⚠️  ACCESS_PASSWORD not set. API is publicly accessible!');
    return next();
  }

  // health check는 항상 허용
  if (req.path === '/health') {
    return next();
  }

  // 헤더에서 인증 정보 확인
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  const authCookie = req.cookies?.auth_token;

  let providedPassword = null;

  // Authorization: Bearer <password> 형식
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedPassword = authHeader.substring(7);
  }
  // X-API-Key: <password> 형식
  else if (apiKey) {
    providedPassword = apiKey;
  }
  // 쿠키에서 확인 (웹 UI용)
  else if (authCookie) {
    providedPassword = authCookie;
  }

  // 비밀번호 확인
  if (providedPassword === accessPassword) {
    return next();
  }

  // 인증 실패
  return res.status(401).json({
    success: false,
    error: {
      message: 'Authentication required. Please provide valid credentials.',
      hint: 'Use Authorization: Bearer <password> or X-API-Key: <password> header'
    }
  });
};

/**
 * 웹 UI 접근 체크 미들웨어
 */
const checkWebAuth = (req, res, next) => {
  // 비밀번호가 설정되지 않은 경우 인증 비활성화
  const accessPassword = process.env.ACCESS_PASSWORD;

  if (!accessPassword) {
    return next();
  }

  // 로그인 페이지는 항상 허용
  if (req.path === '/login' || req.path === '/login.html') {
    return next();
  }

  // 정적 파일 (CSS, JS)도 허용
  if (req.path.startsWith('/css/') || req.path.startsWith('/js/')) {
    return next();
  }

  // 쿠키 또는 세션에서 인증 확인
  const authCookie = req.cookies?.auth_token;

  if (authCookie === accessPassword) {
    return next();
  }

  // 미인증 시 로그인 페이지로 리다이렉트
  return res.redirect('/login');
};

module.exports = {
  requireAuth,
  checkWebAuth
};
