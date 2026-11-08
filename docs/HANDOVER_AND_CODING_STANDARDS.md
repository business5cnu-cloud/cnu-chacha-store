# CNU ChaCha Store 개발자 인수인계 및 코드 표준 가이드

본 문서는 **충남대학교 차차(CHA CHA) 공식 굿즈 스토어** 프로젝트를 새롭게 인수인계받는 개발자 및 유지보수 담당자를 위한 통합 기술 가이드입니다. 

---

## 1. 프로젝트 개요 및 아키텍처

### 1-1. 기술 스택
* **프론트엔드 프레임워크**: Next.js 14 (App Router, Static HTML Export `output: 'export'`)
* **언어 및 컴파일러**: TypeScript 5.7, React 18
* **스타일링**: Tailwind CSS 3.4, Lucide React (아이콘)
* **데이터 시각화**: Recharts (관리자 대시보드 및 판매 분석)
* **테스트 프레임워크**: Vitest 2.1 (단위 테스트)
* **호스팅 및 배포**: Firebase Hosting (Google Cloud 기반 글로벌 CDN)
* **데이터베이스 및 인증 아키텍처**:
  * Supabase Auth & PostgreSQL 호환 스키마 설계
  * 환경 변수 미등록 시에도 100% 독립 실행 가능한 **LocalStorage 기반 자립형 스토어 엔진 (`StoreProvider`)** 내장

### 1-2. 디렉터리 구조

```
cnu-chacha-store/
├── .agents/rules/               # AI 어시스턴트 코드 규칙
├── docs/                        # 개발자 인수인계 문서
├── public/                      # 정적 에셋
│   ├── downloads/               # 바탕화면 바로가기 런처 (.exe, .bat)
│   └── images/
│       ├── chacha/              # 공식 캐릭터 원화 및 배너 에셋
│       └── products/            # 16종 굿즈 다중 해상도 이미지
│           ├── thumbnail/       # 120×120px (목록/장바구니)
│           ├── medium/          # 400×400px (카드 뷰/모바일)
│           ├── large/           # 1600×1600px (상세 뷰어/돋보기)
│           └── original/        # 고화질 마스터 원본
├── scripts/
│   ├── serve_out.js             # 정적 빌드 로컬 서빙 서버
│   └── archive/                 # 3D 렌더링/데이터 마이그레이션 도구 보관함
├── src/
│   ├── app/                     # Next.js 14 App Router
│   │   ├── (store)/             # 일반 사용자 쇼핑몰 라우트 (메인, 상품, 피팅룸, 마이페이지 등)
│   │   └── admin/               # 관리자 백오피스 라우트 (대시보드, 상품/주문/재고/의뢰 관리)
│   ├── components/              # 재사용 UI 컴포넌트
│   ├── hooks/                   # 전역 상태 훅 (`useStore.tsx`)
│   ├── lib/                     # 유틸리티 및 시드 데이터 (`seed-data.ts`)
│   └── types/                   # TypeScript 타입 정의 (`index.ts`)
├── firebase.json                # Firebase Hosting 설정
└── package.json                 # 의존성 및 스크립트
```

---

## 2. 로컬 개발 환경 셋업 및 실행

### 2-1. 패키지 설치
```bash
npm install
```

### 2-2. 개발 모드 실행 (Hot Reload)
```bash
npm run dev
# 접속: http://localhost:3000
```

### 2-3. 프로덕션 정적 빌드 및 로컬 테스트
```bash
# 1. 정적 빌드 생성 (out/ 폴더 생성)
npm run build

# 2. 로컬 정적 서버로 테스트
npm run serve
# 접속: http://localhost:3000
```

---

## 3. 핵심 모듈 동작 원리

### 3-1. 전역 상태 관리 (`src/hooks/useStore.tsx`)
* 쇼핑몰의 모든 상태(상품 목록, 장바구니, 주문, 회원 정보, 리뷰, 제작 의뢰)는 `StoreProvider`를 통해 싱글톤으로 제공됩니다.
* **캐시 키 버전 관리 (`STORAGE_KEYS`)**:
  * 브라우저 로컬 스토리지에 데이터가 저장되므로, `seed-data.ts`의 기본 데이터나 이미지 경로를 크게 변경할 때는 `useStore.tsx`의 `STORAGE_KEYS` 접미사(예: `_v5`)를 올려주면 기존 사용자 브라우저에서도 최신 데이터가 깨끗하게 반영됩니다.

### 3-2. 다중 해상도 이미지 파이프라인
* 16개 굿즈 상품은 성능과 선명도를 위해 다중 해상도를 지원합니다:
  * `thumbnail_url`: 목록 페이지 속도 최적화
  * `medium_url`: 상품 카드 및 일반 뷰
  * `large_url`: 상품 상세 페이지 인터랙티브 돋보기(2.2배 확대) 및 풀스크린 줌 뷰어

### 3-3. 관리자 계정 정보 (시연용 기본값)
* **아이디**: `admin@cnu-chacha-store.kr`
* **비밀번호**: `admin1234!`
* 관리자 페이지 URL: `/admin/login` 및 `/admin/dashboard`

### 3-4. 고객 화면과 관리자 포털 분리 정책 (Customer UX & Admin Separation)
* **목적**: 쇼핑몰의 전문성 및 신뢰도 향상, 고객 혼란 방지, 관리자 시스템 경로 보안 유지
* **공개 화면 내 관리자 링크 노출 배제 원칙**:
  * **고객 로그인 창 (`/login`)**: 순수 학생회원 전용 로그인 화면으로 유지하며, 관리자 로그인 이동 링크를 배치하지 않습니다.
  * **상단 헤더 띠 배너 (`Header.tsx`)**: 일반 방문객에게 노출되는 '관리자 센터' 링크를 삭제하고 고객 편의 기능(아이콘 받기, VR 피팅, 리폼 의뢰)만 제공합니다.
  * **하단 푸터 (`Footer.tsx`)**: 'MY ACCOUNT & ADMIN' 대신 'MY ACCOUNT'로 단정하게 정리하고, '관리자 전용 백오피스' 버튼을 노출하지 않습니다.
* **관리자 포털 접속 가이드**:
  1. **직접 URL 접근**: 관리자 운영진은 주소창에 직접 `/admin` 또는 `/admin/login`으로 접속합니다.
  2. **로그인 상태 연동**: 관리자 권한(`role: 'admin'`)을 가진 계정으로 로그인한 경우에만 상단 헤더 프로필 옆에 `[🛡️ 관리자]` 버튼이 조건부로 노출되어 대시보드로 즉시 이동할 수 있습니다.

---

## 4. 커밋 및 배포 시 지켜야 할 품질 표준 (Clean Code Rules)

새로운 기능을 추가하거나 코드를 수정한 후 커밋할 때는 **항상 아래 3단계 검증을 완료**해야 합니다:

### 1단계: 타입 및 린트 검사
```bash
npm run typecheck    # TypeScript 타입 에러 0건 필수
npm run lint         # 린트 검사
```

### 2단계: 자동화 단위 테스트
```bash
npm run test         # vitest 기반 5개 테스트 전체 통과 확인
```

### 3단계: 프로덕션 빌드 검증
```bash
npm run build        # 60개 페이지 정적 빌드 오류 없음 확인
```

### ⚠️ Firebase 배포 시 주의사항 (Spark 플랜)
Firebase 무료(Spark) 플랜 정책상 실행 파일(`.exe`, `.bat`, `.cmd`) 업로드가 차단되므로, 빌드 후 `out/downloads/`에 복사된 실행 파일은 배포 전 반드시 제외해야 합니다:
```powershell
# 배포 전 빌드 디렉터리 내 실행 파일 정리
Remove-Item -Force -Recurse out/downloads/*.exe, out/downloads/*.bat -ErrorAction SilentlyContinue
```

---

## 5. 문의 및 관리 안내
* 본 프로젝트는 충남대학교 차차 공식 브랜딩 가이드라인을 준수하여 제작되었습니다.
* 추가 상품 등록 시에는 `public/images/products/` 디렉터리에 고해상도 이미지를 규격에 맞게 배치하고 `seed-data.ts`에 SKU 및 옵션을 등록하시면 됩니다.
