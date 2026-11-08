# 🦄 CNU CHA CHA STORE: 마스터 통합 개발 및 원클릭 재현 지시서 (All-in-One Master Specification)

> **문서 버전**: v2.5.0 (Full Production Edition)  
> **기준 일시**: 2026-11-06  
> **공식 라이브 호스팅**: [https://cnu-chacha-store.web.app](https://cnu-chacha-store.web.app)  
> **공식 마스코트**: 충남대학교 공식 캐릭터 **'차차(CHA CHA)'**  
> **문서 목적**: 다른 컴퓨터나 새로운 AI 어시스턴트 세션에서 본 프로젝트를 열었을 때, **기본 쇼핑몰 구축부터 관리자 백오피스, VR 가상 피팅룸, 16종 실물 굿즈 목업 파이프라인, 바탕화면 런처, 24시간 Firebase 배포, 그리고 무결성 검증 체계까지의 모든 작업 내용을 단 한 번에 완벽하게 이해하고 재현·수행**할 수 있도록 작성된 종합 기술 명세서입니다.

---

## 1. 프로젝트 마스터 개요 및 AI 페르소나

### 1-1. AI 엔지니어 페르소나
당신은 최고 수준의 **수석 풀스택 웹 개발자이자 프로덕트 디자이너**입니다.  
충남대학교를 대표하는 공식 마스코트 '차차'의 매력을 극대화한 이커머스 웹 애플리케이션을 결함 없이 설계, 구현, 검증, 배포합니다.

### 1-2. 핵심 서비스 정의
- **서비스명**: CNU CHA CHA STORE (충남대학교 차차 공식 굿즈 쇼핑몰)
- **주요 타깃**: 충남대학교 재학생, 대학원생, 교수진, 동문 졸업생, 캐릭터 수집가 및 대전 지역 주민
- **기본 화폐 및 로케일**: 원화(`KRW`, `₩`), 한국어(`ko-KR`), 기준 시간대(`Asia/Seoul`)
- **디자인 철학**:
  - 대학생 감성의 트렌디하고 세련된 네이비(`CNU Navy`, `#002C5F`), 차차 블루(`Sky Blue`), 화이트 기반의 톤앤매너
  - 모바일, 태블릿, 데스크톱 전 기기 완벽 대응 반응형 웹(Responsive Web)
  - 매끄러운 마이크로 인터랙션, 부드러운 애니메이션 및 둥근 모서리(Rounded-2xl) 카드 UI

---

## 2. 기술 스택 및 아키텍처

| 계층 | 기술 | 비고 |
| :--- | :--- | :--- |
| **Framework** | Next.js 14+ (App Router) | 정적 사이트 사전 생성 (`output: 'export'`) |
| **Language** | TypeScript (Strict Mode) | 타입 무결성 보장 (`tsc --noEmit`) |
| **UI Library** | React 18+ | 함수형 컴포넌트, Hooks, Context API |
| **Styling** | Tailwind CSS 3+ | 반응형 유틸리티 클래스 |
| **Icons** | Lucide React | 현대적이고 일관된 미니멀 아이콘 세트 |
| **Charts** | Recharts | 관리자 대시보드 및 판매 분석 시각화 |
| **Testing** | Vitest | 빠른 단위 및 통합 테스트 환경 |
| **State / Cache** | Custom Hooks + localStorage | 전역 장바구니/찜/리폼 상태 및 캐시 버스팅 |
| **Auth / Security** | Supabase Auth 호환 + RLS | 관리자(`role: 'admin'`) 접근 통제 및 403 차단 |
| **Deployment** | Google Firebase Hosting | Spark 무료 요금제, 글로벌 CDN 배포 |
| **Launcher** | C# (`csc.exe`) 바이너리 런처 | Windows 모든 PC 공용 차차 아이콘 런처 |

---

## 3. 전체 사이트 맵 및 디렉터리 구조

### 3-1. 사용자/관리자 라우팅 맵
```
[고객용 스토어프론트 (Public Storefront)]
├── /                       : 메인 홈 (히어로 배너, 인기 TOP 5, 신상품, 실물 포토 후기)
├── /products               : 전체 상품 갤러리 (검색, 카테고리 필터, 정렬)
├── /categories/[slug]      : 카테고리별 상품 목록 (clothing, stationery, goods, limited)
├── /products/[id]          : 상품 상세 (다중 해상도 돋보기, 옵션, 장바구니, [정책 7] AI 안내)
├── /fitting                : NEW 차차 VR 가상 피팅룸 (3종 공식 룩북 + 커스텀 드레스업)
├── /cart                   : 장바구니 및 주문 요약 (3만원 이상 무료배송 자동 계산)
├── /checkout               : 주문서 작성 및 결제 승인 (토스페이먼츠 연동 / 테스트 모드)
├── /login, /signup         : 고객 로그인 및 회원가입
└── /mypage, /mypage/orders : 마이페이지 및 주문 상세 내역 조회

[관리자 백오피스 (Admin Backoffice)]
├── /admin/login            : 관리자 전용 인증 게이트웨이
├── /admin/dashboard        : 총괄 운영 대시보드 (핵심 KPI 지표, Recharts 그래프, 최근 주문)
├── /admin/products         : 상품 등록/수정/삭제 및 판매 상태 변경
├── /admin/sales            : 전체 상품 판매 분석 테이블 (정렬, 기간 필터, CSV 다운로드)
├── /admin/sales/[productId]: 개별 상품 심층 판매 분석
├── /admin/inventory        : 실시간 창고 재고 입출고 및 안전 재고 알림
├── /admin/orders           : 주문 상태(결제완료 ➔ 배송중 ➔ 배송완료 등) 변경 및 배송지 관리
├── /admin/commissions      : 학과 단체 굿즈 & 헌 과잠 업사이클링 인형 옷 리폼 접수 현황
├── /admin/customers        : 고객 명부 및 주문 통계
└── /admin/limited          : 한정판 상품 전용 수량/기간 제어
```

### 3-2. 소스코드 디렉터리 구성
```
cnu-chacha-store/
├── docs/
│   └── HANDOVER_AND_CODING_STANDARDS.md  # 개발자 인수인계서 및 코딩 표준
├── public/
│   ├── downloads/                        # 바탕화면 바로가기 런처 배포 파일 (.exe, .bat)
│   ├── images/
│   │   ├── chacha/                       # 차차 공식 일러스트 (기본, 과잠, 학사복, 아이콘)
│   │   └── products/                     # 16종 실물 굿즈 다중 해상도 이미지
│   │       ├── thumbnail/                # 100×100 초경량 썸네일 (장바구니용)
│   │       ├── medium/                   # 400×400 중간 해상도 (그리드 카드용)
│   │       ├── large/                    # 800×800 초고화질 (상세페이지 확대용)
│   │       └── lifestyle/                # 캠퍼스 및 일상 착용 연출 샷
│   └── manifest.json                     # PWA 설치 지원 매니페스트
├── scripts/
│   ├── serve_out.js                      # 로컬 정적 빌드 테스트용 경량 Node.js 웹 서버
│   ├── README.md                         # 스크립트 관리 가이드
│   └── archive/                          # 이전 일회성 개발 스크립트 격리 보관소
├── src/
│   ├── app/                              # Next.js App Router 페이지 및 정적 파라미터
│   ├── components/
│   │   ├── admin/                        # 관리자 전용 컴포넌트
│   │   ├── common/                       # 공용 헤더/푸터/배지/모달
│   │   └── store/                        # 스토어프론트 전용 (장바구니 드로어, 리폼 모달 등)
│   ├── hooks/                            # useStore.tsx (전역 상태 및 캐시 동기화)
│   └── lib/                              # 16종 상품 데이터, 비즈니스 로직, 결제 유틸리티
├── .agents/rules/                        # Antigravity/AI 3단계 무결성 검사 규칙
├── AGENTS.md / GEMINI.md                 # 커밋 전 필수 수칙 문서
├── firebase.json / .firebaserc           # Firebase Hosting 정적 배포 설정
└── next.config.mjs                       # Next.js 정적 추출 (output: 'export') 설정
```

---

## 4. 16종 공식 차차 굿즈 데이터 및 다중 해상도 목업 파이프라인

모든 상품은 평면 캐릭터 그림이 아닌 **전문 스튜디오 조명과 패브릭/세라믹 질감이 살아있는 실물 굿즈 3D 목업**을 사용합니다.

### 4-1. 16종 상품 마스터 카탈로그

| ID | 카테고리 | 상품명 | 판매가 | 할인가 | 규격/옵션 | 대표 목업 파일명 |
| :---: | :---: | :--- | :---: | :---: | :--- | :--- |
| `1` | 의류 | 차차 시그니처 자수 후드티 | ₩49,000 | ₩45,000 | Navy/Oatmeal, S~XL | `prod-hoodie.png` |
| `2` | 의류 | 코튼 스포츠 차차 양말 | ₩6,000 | ₩5,500 | White/Navy/Grey | `prod-socks.png` |
| `3` | 문구 | 차차 다이어리 점착 메모지 | ₩4,500 | ₩4,000 | 4종 1세트 | `prod-memo.png` |
| `4` | 문구 | 시즌 한정 홀로그램 스티커 | ₩3,500 | ₩3,000 | 유광 방수 코팅 | `prod-limited-sticker.png` |
| `5` | 잡화 | 에폭시 마그네틱 맥세이프 그립톡 | ₩13,500 | ₩12,000 | 기본/과잠/학사복 | `prod-griptok.png` |
| `6` | 잡화 | 말랑 아크릴 글리터 키링 | ₩8,500 | ₩7,900 | 에어팟/가방 고리용 | `prod-keyring.png` |
| `7` | 잡화 | 세라믹 코팅 보온 텀블러 (500ml) | ₩26,000 | ₩23,500 | Matte Navy/White | `prod-tumbler.png` |
| `8` | 잡화 | 컬렉터블 랜덤 미니 피규어 | ₩9,900 | ₩9,000 | 6종 랜덤 + 시크릿 | `prod-figure.png` |
| `9` | 잡화 | 네오프렌 랩탑 파우치 (14/16") | ₩28,000 | ₩25,000 | 14인치 / 16인치 | `prod-laptop-pouch.png` |
| `10` | 잡화 | 맥세이프 고속 무선 보조배터리 | ₩35,000 | ₩31,500 | 10000mAh, LED | `prod-powerbank.png` |
| `11` | 잡화 | 휴대용 살균 양치도구 세트 | ₩15,000 | ₩13,500 | 파스텔 블루 케이스 | `prod-toothbrush.png` |
| `12` | 잡화 | 워터프루프 여행용 압축 파우치 | ₩18,000 | ₩16,000 | 3종 세트 | `prod-travel-pouch.png` |
| `13` | 잡화 | 클린 린넨 룸 & 차량용 방향제 | ₩14,000 | ₩12,500 | 코튼 / 시트러스 | `prod-car-freshener.png` |
| `14` | 잡화 | 16수 헤비 캔버스 차차 에코백 | ₩19,000 | ₩17,000 | 이너포켓 포함 | `prod-ecobag.png` |
| `15` | 한정판 | 커스텀 학과 과잠 인형 (30cm) | ₩38,000 | ₩35,000 | 학과 자수 각인 옵션 | `prod-custom-doll.png` |
| `16` | 한정판 | 2026 시즌 한정 벚꽃 에디션 인형 | ₩42,000 | ₩39,000 | 넘버링 인증서 동봉 | `prod-season-doll.png` |

### 4-2. 다중 해상도 반응형 이미지 시스템 & 캐시 버스팅
1. **해상도별 폴더 분기**:
   - `thumbnail/` (100×100): 장바구니 리스트, 미니 결제 요약창 초고속 로딩
   - `medium/` (400×400): 메인 상품 그리드, 카테고리 카드용
   - `large/` (800×800): 상품 상세 페이지 돋보기 줌용
   - `lifestyle/`: 캠퍼스 배경 일상 착용 룩북용
2. **8대 스튜디오 퀄리티 기준**:
   - 스튜디오 3점 조명 및 자연스러운 바닥 소프트 섀도우
   - 실제 생산품과 동일한 패브릭 자수, 세라믹 유광/무광 텍스처
   - 1:1 정방형 캔버스 규격 통일
3. **캐시 버스팅 (Cache Busting)**:
   - 사용자가 옛 브라우저 캐시로 인해 구형 일러스트를 보는 현상을 방지하기 위해 `v20261105-realgoods-v4` 버전 키를 `src/hooks/useStore.tsx`에 내장하여 첫 접속 시 자동으로 최신 실물 굿즈 목업을 로딩하도록 보장합니다.

---

## 5. 고객용 스토어프론트 상세 구현 지침

### 5-1. 메인 홈 (`/`)
- **히어로 배너**: 감성적인 카피와 함께 [지금 쇼핑하기], [VR 피팅룸 체험하기] 원클릭 CTA 버튼 배치
- **TOP 5 랭킹 & 탭별 큐레이션**: 누적 판매량 기반 실시간 랭킹 순위 배지 및 탭 전환 지원
- **실물 포토 후기 카드 4종**: 학우들의 실제 착용 스튜디오 샷(후드티, 양말, 텀블러, 키링)을 적용하여 신뢰도 극대화

### 5-2. 상품 목록 및 상세 페이지 (`/products`, `/products/[id]`)
- **스마트 검색 & 다중 필터**: 상품명/SKU 실시간 인덱스 검색, 카테고리 필터, 가격순/인기순/최신순 정렬
- **[정책 7] AI 그래픽 보정 안내 배지**:
  - 고객에게 불필요한 내부 개발 지침 배지는 숨기고, 전자상거래법 소비자 오인 방지 원칙에 따라 AI 그래픽 시뮬레이션이 가미된 상품에만 단정한 인디고 톤(`bg-indigo-50/80 text-indigo-700`) 안내 칩을 조건부로 렌더링
- **슬라이드 장바구니 드로어 (`CartDrawer.tsx`)**:
  - 어떤 페이지에서든 장바구니 버튼 클릭 시 페이지 이동 없이 우측에서 스르륵 열리며 수량 변경 및 3만 원 이상 무료배송 차액을 실시간 안내

### 5-3. 장바구니 및 체크아웃 (`/cart`, `/checkout`)
- **주문 스냅샷 보존**: 주문 시점의 상품명, 옵션, 단가, 썸네일을 그대로 고정하여 향후 가격 변동 시에도 과거 주문 내역 보존
- **토스페이먼츠 연동**: 실 결제 키가 없을 경우에도 완벽한 사용자 플로우를 테스트할 수 있는 '안전 테스트 결제 모드' 자동 지원

---

## 6. VR 가상 피팅룸 엔진 (`/fitting`)

충남대학교 마스코트 차차에게 다양한 의상과 모자를 입혀보고 코디 조합의 금액을 확인해 즉시 장바구니로 담는 인터랙티브 체험 공간입니다.

1. **공식 고해상도 차차 모델 3종 탑재**:
   - `fitting_basic.jpg`: 기본 화이트 셋업 차차
   - `fitting_varsity.jpg`: 충남대 공식 네이비 과잠 착용 차차
   - `fitting_graduation.jpg`: 골드 태슬 학사모 및 졸업 학사복 착용 차차
2. **원클릭 공식 룩북 프리셋**:
   - [기본 차차] / [충남대 과잠 룩] / [영광의 졸업 룩] 프리셋 버튼으로 즉시 모델 전환
3. **투명 SVG 좌표 오버레이 옷 갈아입히기**:
   - `<svg viewBox="0 0 1024 1024">` 규격으로 고화질 원본 사진 위에 스카이 후드티, 니트 조끼, 데님 멜빵, 볼캡, 화관 등을 1픽셀 오차 없이 정확히 레이어링
4. **실시간 코디 금액 합산 및 장바구니 동기화**:
   - 착용한 의상들의 총금액을 계산하고 [이 코디 세트로 담기] 클릭 시 장바구니에 일괄 담기

---

## 7. 주문제작 & 헌 과잠 업사이클링 리폼 시스템

충남대 학우와 졸업생을 위한 차별화된 맞춤형 커스텀 서비스입니다.

1. **고객 신청 모달 (`CommissionModal.tsx`)**:
   - 학과/동아리 단체 굿즈 제작 의뢰
   - 졸업생 헌 과잠을 기증받아 세상에 하나뿐인 인형 옷으로 업사이클링하는 리폼 신청 (의뢰자명, 학과, 희망 자수 이니셜, 원단 상태 작성)
2. **관리자 접수 현황판 (`/admin/commissions`)**:
   - 접수된 의뢰 목록, 상태 변경(`접수 대기` ➔ `상담 진행 중` ➔ `제작 중` ➔ `제작 완료`), 상담 메모 기록 기능 제공

---

## 8. 관리자 전용 통합 백오피스 (`/admin`)

일반 손님과 관리자의 권한을 엄격히 분리(`role: 'admin'`)하며, 일반 회원의 접근을 403 Forbidden으로 차단합니다.

1. **운영 대시보드 (`/admin/dashboard`)**:
   - 총매출, 당일 매출, 당월 매출, 총 주문 건수, 재고 현황 KPI 카드
   - Recharts 기반 일별/월별/카테고리별 매출 추이 시각화 인터랙티브 그래프
2. **제품별 판매 분석 (`/admin/sales`, `/admin/sales/[productId]`)**:
   - 16종 상품별 판매량, 누적 매출, 재고 회전율 분석 및 CSV 엑셀 다운로드
3. **실시간 재고 관리 (`/admin/inventory`)**:
   - 재고 입고/출고 수량 조절 및 품절 임박(재고 10개 미만) 경고 하이라이트
4. **고객 화면 내 관리자 링크 노출 분리 정책**:
   - 고객 로그인 창(`/login`), 상단 띠 배너(`Header.tsx`), 하단 푸터(`Footer.tsx`)에서 일반 손님용 관리자 진입 버튼을 완전히 배제하여 전문 쇼핑몰 UX 유지
   - 관리자는 `/admin` 또는 `/admin/login`으로 직접 접속하며, 로그인 시에만 상단 헤더에 `[🛡️ 관리자]` 이동 뱃지가 조건부로 활성화됨

---

## 9. Windows 바탕화면 차차 단일 런처 & PWA 아키텍처

로컬 하드디스크 경로에 의존하지 않고, **어느 PC 바탕화면으로 옮겨도 차차 과잠 아이콘이 100% 영구 보존되는 배포 체계**입니다.

1. **57KB 초경량 C# 단일 바이너리 런처 (`CNU-ChaCha-Store.exe`)**:
   - Windows 기본 내장 C# 컴파일러(`csc.exe`)로 `chacha_icon.ico` 바이너리 리소스를 실행 파일 몸체 내부에 영구 각인
   - 더블클릭 시 기본 브라우저로 `https://cnu-chacha-store.web.app`을 즉시 실행
2. **원클릭 자동 설치 스크립트 (`install-chacha-shortcut.bat`)**:
   - Firebase 서버에서 아이콘을 자동 내려받아 바탕화면에 정식 `.url` 바로가기를 생성
3. **PWA 웹앱 (`public/manifest.json`)**:
   - Chrome/Edge 브라우저 주소창 우측의 [앱 설치] 버튼으로 바탕화면 단독 앱으로 설치 가능

---

## 10. Google Firebase Hosting 24시간 정적 배포 파이프라인

내 컴퓨터를 꺼도 전 세계 어디서든 무료로 접속할 수 있는 글로벌 CDN 배포 규격입니다.

1. **Next.js 정적 추출 (`next.config.mjs`)**:
   ```javascript
   const nextConfig = {
     output: 'export',
     images: { unoptimized: true },
     trailingSlash: true,
   };
   export default nextConfig;
   ```
2. **동적 라우팅 사전 생성 (`generateStaticParams`)**:
   - `/products/[id]`, `/categories/[slug]`, `/admin/sales/[productId]` 등 모든 동적 주소에 대해 60개의 정적 HTML 페이지를 빌드 시점에 완벽히 사전 렌더링
3. **Spark(무료) 플랜 보안 규정 준수 (`firebase.json`)**:
   - Spark 플랜의 실행 파일 업로드 제한에 따라 `out/downloads` 내 `.exe`, `.bat`은 배포 대상에서 자동 제외되도록 ignore 설정

---

## 11. 커밋 전 3단계 무결성 검증 및 클린 코드 규칙

모든 작업자와 AI는 코드를 커밋하기 전 반드시 다음 3단계를 순서대로 통과해야 합니다.

```bash
# 1단계: TypeScript 타입 에러 검사 (에러 0건 필수)
npm run typecheck

# 2단계: 단위 테스트 검사 (테스트 전체 통과 필수)
npm run test

# 3단계: 정적 사이트 빌드 검사 (60개 페이지 생성 성공 필수)
npm run build
```

- **작업 공간 청결 유지**:
  - 일회성 개발/테스트 스크립트는 `scripts/archive/`에 보관하며, 루트 `scripts/`에는 서비스용 `serve_out.js`만 유지합니다.
  - 디버깅용 `console.log` 및 미사용 `import`는 정리 후 커밋합니다.

---

## 12. 다른 컴퓨터에서의 원클릭 재현/실행 가이드

새로운 컴퓨터나 작업 환경에서 이 프로젝트를 처음 구동할 때 아래 명령어만 순서대로 실행하면 즉시 완전한 쇼핑몰이 작동합니다.

### 12-1. 저장소 클론 및 패키지 설치
```bash
git clone https://github.com/business5cnu-cloud/cnu-chacha-store.git
cd cnu-chacha-store
npm install
```

### 12-2. 로컬 개발 서버 실행
```bash
npm run dev
# 웹 브라우저에서 http://localhost:3000 접속
```

### 12-3. 무결성 검증 및 정적 빌드
```bash
npm run typecheck
npm run test
npm run build
```

### 12-4. 빌드된 정적 사이트 로컬 테스트
```bash
node scripts/serve_out.js
# 웹 브라우저에서 http://localhost:3000 접속
```

### 12-5. Firebase 실서버 24시간 배포
```bash
npx firebase-tools deploy --only hosting --non-interactive
# 실 배포 URL: https://cnu-chacha-store.web.app
```

---

## 13. 테스트 계정 정보

- **관리자 전용 계정**: `admin@cnu.ac.kr` / 비밀번호: `admin1234!` (또는 `admin@cnu-chacha.kr` / `ChachaAdmin!2026`)
- **고객 테스트 계정**: `chacha.fan@o.cnu.ac.kr` / 비밀번호: `cnu1234!`
