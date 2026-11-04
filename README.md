# CNU CHA CHA STORE (충남대학교 차차 공식 굿즈 쇼핑몰)

충남대학교 마스코트 **'차차(CHA CHA)'**를 활용한 공식 굿즈 쇼핑몰(`https://cnu-chacha-store.web.app`), VR 가상 피팅룸(`https://cnu-chacha-store.web.app/fitting`), 그리고 관리자 전용 백오피스(`https://cnu-chacha-store.web.app/admin/dashboard`)가 통합된 웹 애플리케이션입니다.

### 🌐 24시간 운영 라이브 사이트 주소 (Firebase Hosting)
- **메인 쇼핑몰**: https://cnu-chacha-store.web.app
- **NEW 차차 VR 가상 피팅룸**: https://cnu-chacha-store.web.app/fitting
- **관리자 백오피스 (대시보드)**: https://cnu-chacha-store.web.app/admin/dashboard
- **관리자 주문제작·과잠 리폼 의뢰 관리**: https://cnu-chacha-store.web.app/admin/commissions

---

## 1. 주요 구현 기능 요약

### 고객용 쇼핑몰 (`/`)
- **메인 페이지 (`/`)**: 차차 캐릭터 메인 배너(쇼핑하기 버튼), 브랜드 소개, 인기 상품 TOP 5, 신상품 소개, 시즌 한정 상품 소개, 카테고리별 탭 상품, MD 추천 상품, 반응형 헤더/푸터
- **상품 목록 및 카테고리 (`/products`, `/categories/[slug]`)**:
  - 4대 카테고리(**의류, 문구, 잡화, 한정판**) 및 필수 16종 상품 기본 탑재
  - 상품명/설명/SKU 검색, 판매 상태 필터(전체/판매중/품절), 한정판 전용 필터
  - 인기순(판매량), 최신순, 낮은 가격순, 높은 가격순 정렬
- **상품 상세 페이지 (`/products/[id]`)**:
  - 대표/상세 이미지(교체 가능한 플레이스홀더 및 커스텀 업로드 지원), 정가/할인가/할인율 표시
  - 옵션 선택 및 수량 선택, 실시간 총 금액 계산
  - **한정판 전용 안내 패널**: 한정판 배지, 판매 기간, 총 한정 수량, 남은 재고, 판매 종료 안내
- **장바구니 (`/cart`)**: 상품 추가/삭제, 수량/옵션 변경, 재고 부족 시 주문 제한 처리, 3만원 이상 무료배송 자동 계산
- **회원 시스템 (`/login`, `/signup`, `/mypage`, `/mypage/orders`)**:
  - Supabase Auth 호환 로그인/회원가입/로그아웃/비밀번호 재설정 요청
  - 마이페이지 개인정보 및 기본 배송지 수정, 주문 내역 및 주문 상세·이력 조회, 주문 취소 요청
- **주문 및 결제 (`/checkout`, `/api/payments/confirm`)**:
  - 토스페이먼츠 연동 구조 및 API 키 미설정 시 **안전한 테스트 결제 모드** 자동 전환
  - 브라우저 전달 값만 신뢰하지 않고 서버 API(`/api/payments/confirm`)에서 금액 및 유효성 검증 수행
  - 주문 시 상품명·단가·옵션 스냅샷 보존 및 재고 차감 트랜잭션 처리

### 관리자 전용 백오피스 (`/admin`)
- **관리자 로그인 및 권한 보안 (`/admin/login`, `/api/admin/verify`)**:
  - 관리자(`role: 'admin'`) 전용 접근 제어, 일반 회원 접근 시 `403 Forbidden` 즉시 차단
  - Supabase RLS 정책 및 일반 회원의 `role` 변경 차단 DB 트리거 포함
- **관리자 대시보드 (`/admin/dashboard`)**:
  - 8대 핵심 지표(총매출, 오늘 매출, 이번 달 매출, 총 주문 건수, 오늘 주문 건수, 총 판매 수량, 등록 상품 수, 품절 상품 수)
  - 테스트 결제 주문 제외 집계 토글 및 재고 부족(5개 이하) 실시간 경고 배너
  - **Recharts 매출 분석 차트**: 일별/주별/월별 매출 추이, 기간별 주문 건수, 카테고리별 매출 비중, 상품별 매출 비교 (최근 7일/30일/90일/올해/직접 날짜 지정)
  - 인기 상품 TOP 5 및 최근 주문 내역
- **제품별 판매 분석 (`/admin/sales`, `/admin/sales/[productId]`)**:
  - 전체 상품 판매 현황 검색, 카테고리/기간 필터, 판매량/매출/재고 정렬, 전체 현황 CSV/엑셀 다운로드
  - 개별 상품 심층 분석(`/admin/sales/[productId]`): 누적/오늘/이번 달 판매량, 총 주문 건수, 누적 매출, **취소 건수 및 환불 건수 분리 집계**, 4종 Recharts 그래프(일별/월별 판매량, 기간별 매출, 주문 추이), 타 상품과의 판매량 비교, 개별 주문 내역 엑셀(CSV) 다운로드
- **상품 관리 (`/admin/products`)**: 상품 등록/수정/삭제(기존 주문 스냅샷 보존), 대표·상세 이미지 파일 업로드 및 URL 등록, 옵션 추가/삭제, 가격/할인가/재고/판매상태 수정
- **주문 관리 (`/admin/orders`)**: 주문번호/고객명/상품명/날짜/상태별 다중 검색, 주문 상태 변경, 배송 택배사·운송장 번호 입력, 주문 취소·환불 처리(자동 재고 복구), 상태 변경 이력 기록
- **재고 관리 (`/admin/inventory`)**: 전체/재고부족/품절 필터, 원클릭 빠른 입고, 입고/출고 수량 등록 및 사유 기록, 전체 재고 변경 이력(`inventory_movements`) 조회
- **고객 관리 (`/admin/customers`)**: 회원 목록 및 검색, 회원별 구매 횟수·누적 구매 금액·최근 구매일·주문 내역 조회, **개인정보 보호 마스킹(`***`) 토글**
- **한정판 관리 (`/admin/limited`)**: 한정판 신규 등록, 판매 시작일/종료일/한정 수량 설정, 판매 시작 및 판매 종료 즉시 전환, 재고 0개 시 자동 품절 처리

---

## 2. 설치 및 실행 방법

```bash
# 1. 패키지 설치
npm install

# 2. 개발 서버 실행
npm run dev
```

- **고객용 쇼핑몰 접속 주소 (Firebase Live)**: https://cnu-chacha-store.web.app
- **VR 가상 피팅룸 접속 주소 (Firebase Live)**: https://cnu-chacha-store.web.app/fitting
- **관리자 백오피스 접속 주소 (Firebase Live)**: https://cnu-chacha-store.web.app/admin/dashboard

### 빌드 및 테스트 명령어
```bash
# TypeScript 타입 검증
npm run typecheck

# ESLint 코드 검사
npm run lint

# 단위 테스트 실행 (Vitest)
npm test

# 프로덕션 빌드
npm run build
```

---

## 3. 환경변수 설정 방법 (`.env.local`)

루트 디렉터리의 `.env.example` 파일을 복사하여 `.env.local` 파일을 생성합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# 토스페이먼츠 API 키 (미입력 시 자동으로 안전한 테스트 결제 모드로 동작합니다)
NEXT_PUBLIC_TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=

NEXT_PUBLIC_SITE_URL=https://cnu-chacha-store.web.app
```

---

## 4. 데이터베이스(Supabase) 초기화 및 관리자 계정 생성 방법

1. Supabase 프로젝트를 생성한 뒤 SQL Editor에서 아래 파일들을 순서대로 실행합니다.
   - 스키마 및 RLS 보안 정책: `supabase/migrations/001_initial_schema.sql`
   - 기본 카테고리 및 16종 상품 초기 데이터: `supabase/seed.sql`
2. **관리자 계정 생성 및 권한 부여 절차**:
   - 일반 회원가입 화면에서는 보안상 `customer` 역할만 부여되며, 일반 회원이 자신의 `role`을 변경하는 것은 `prevent_role_escalation` 트리거로 차단됩니다.
   - 관리자 권한 부여는 Supabase 대시보드의 SQL Editor(Service Role 권한)에서 아래 쿼리를 실행하여 안전하게 설정합니다:
     ```sql
     UPDATE public.profiles
     SET role = 'admin'
     WHERE email = 'admin@cnu.ac.kr';
     ```
   - 하이브리드 데모 모드에서는 기본 관리자 계정(`admin@cnu.ac.kr` / `admin1234!`)과 일반 학생 계정(`chacha.fan@o.cnu.ac.kr` / `cnu1234!`)이 즉시 테스트 가능하도록 사전 구성되어 있습니다.

---

## 5. 배포 방법 (Firebase Hosting)

본 프로젝트는 `next.config.mjs`의 `output: 'export'` 정적 빌드와 `firebase.json`을 통해 **Firebase Hosting(`https://cnu-chacha-store.web.app`)** 에 24시간 구동되도록 배포되어 있습니다.

```bash
# 1. 정적 웹 파일(out/) 빌드
npm run build

# 2. Firebase Hosting 배포
npx -y firebase-tools@latest deploy --only hosting --project cnu-chacha-store
```
