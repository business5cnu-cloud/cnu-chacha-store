# Antigravity & Agent Guidelines for CNU ChaCha Store

본 저장소의 유지보수 및 코드 수정 시 아래 규칙을 항상 최우선으로 준수해야 합니다.

## 📌 핵심 개발 및 정리 규칙 (Strict Compliance)

1. **커밋 전 3단계 무결성 검사**:
   - `npm run typecheck` (`tsc --noEmit`) : 에러 0건 필수
   - `npm run test` (`vitest run`) : 테스트 전체 통과 필수
   - `npm run build` (`next build`) : 정적 페이지 60개 빌드 성공 필수

2. **작업 후 작업 공간 청결 유지 (Clean Workspace)**:
   - 일회성 개발 스크립트는 `scripts/archive/`에 보관하거나 즉시 삭제하고, `scripts/` 루트에는 `serve_out.js`만 유지합니다.
   - 디버깅용 `console.log` 및 사용하지 않는 `import`는 커밋 전에 정리합니다.

3. **Firebase 배포 규칙**:
   - Spark(무료) 플랜의 실행 파일 업로드 제한에 따라 `out/downloads` 내 `.exe`, `.bat` 파일은 배포 전 반드시 제외/삭제해야 합니다.

4. **상세 가이드 문서**:
   - 개발자 인수인계 및 코드 규칙 상세는 `docs/HANDOVER_AND_CODING_STANDARDS.md`를 참고하세요.
