# CNU ChaCha Store 코드 정리 및 인수인계 품질 규칙 (Code Cleanup & Handover Standards)

이 문서는 본 프로젝트의 장기적인 유지보수와 원활한 개발자 인수인계를 위해 정의된 **코드 품질 및 정리 표준 규칙**입니다. 모든 AI 어시스턴트와 개발자는 커밋 전후로 본 규칙을 준수해야 합니다.

---

## 1. 커밋 전/후 3단계 필수 무결성 검증 (3-Step Verification)

코드를 수정하거나 커밋하기 전, 반드시 다음 3가지 검증 명령어가 오류 없이 완료되어야 합니다:

```bash
# 1단계: TypeScript 정적 타입 검사 (에러 0건 필수)
npm run typecheck

# 2단계: 자동화 단위 테스트 실행 (전체 통과 필수)
npm run test

# 3단계: 프로덕션 정적 빌드 검증 (60개 전체 페이지 빌드 성공 필수)
npm run build
```

---

## 2. 임시 파일 및 스크립트 관리 규칙 (Clean Workspace)

1. **`scripts/` 디렉터리 청결 유지**:
   - `scripts/` 루트에는 현재 실제 사용 중인 운영 스크립트(`serve_out.js` 등)만 둡니다.
   - 일회성 마이그레이션, 에셋 변환 등의 임시 스크립트는 작업 완료 후 즉시 삭제하거나 `scripts/archive/`로 이동시킵니다.
2. **임시 테스트 산출물 정리**:
   - 디버깅용 로그 파일, 일회성 `.tmp`, `.jsonl` 등은 커밋 대상에 포함하지 않고 작업 종료 시 정리합니다.
3. **Firebase 배포 산출물 Spark 플랜 준수**:
   - Firebase Spark(무료) 플랜은 실행 파일(`.exe`, `.bat`, `.cmd`) 업로드를 엄격히 차단합니다.
   - `npm run build` 시 `public/downloads/`에서 복사된 실행 파일이 `out/downloads/`에 남아있을 경우 배포 전 반드시 정리합니다.

---

## 3. 코드 작성 및 가독성 원칙 (Clean Code for Handover)

1. **미사용 코드 및 디버깅 로그 제거**:
   - 사용하지 않는 `import`, 선언만 되고 쓰이지 않는 변수는 커밋 전 제거합니다.
   - 임시 확인용 `console.log`는 검증 후 즉시 삭제합니다.
2. **인수인계 친화적 주석 (Handover Comments)**:
   - 복잡한 로직(예: `useStore.tsx`의 캐시 동기화, 트랜잭션 재고 차감, 다중 해상도 이미지 폴백 등)에는 다른 개발자가 빠르게 이해할 수 있도록 **한국어 설명 주석**을 명확히 작성합니다.
3. **캐시 키 버전 관리 (`STORAGE_KEYS`)**:
   - `seed-data.ts`의 기본 데이터 구조나 이미지 URL을 크게 변경할 경우, `useStore.tsx`의 `STORAGE_KEYS` 접미사(예: `_v4` -> `_v5`)를 올려주어 기존 사용자의 로컬 스토리지 캐시 충돌을 방지합니다.
4. **데이터 모델 변경 주의**:
   - `src/types/index.ts`의 주요 인터페이스 필드명을 변경할 때는 연관된 모든 페이지 컴포넌트와의 호환성을 사전에 전수 검사합니다.

---

## 4. 보안 및 비밀정보 보호 (Zero Secrets Policy)

- 실제 서비스 계정의 비밀번호, 운영용 Supabase Service Role Key, Toss Payments Secret Key 등 민감 정보는 절대 코드베이스에 하드코딩하지 않습니다.
- 모든 기능은 환경 변수가 없어도 시연 및 로컬 테스트가 가능한 **자립형 안전 모의(Mock) 모드**를 기본 지원해야 합니다.
