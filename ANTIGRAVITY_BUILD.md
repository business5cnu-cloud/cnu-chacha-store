# CNU CHA CHA STORE
## 충남대학교 차차 굿즈 쇼핑몰 통합 개발 지시서

---

# 1. 프로젝트 개요

당신은 숙련된 풀스택 개발자이자 UI/UX 디자이너입니다.

충남대학교 마스코트 '차차'를 활용한 굿즈 전문 쇼핑몰을 개발합니다.

단순한 상품 소개 사이트가 아니라 실제 운영 가능한 쇼핑몰과 관리자 전용 백오피스가 통합된 웹 애플리케이션을 제작합니다.

모든 요구사항을 확인하고 실제 프로젝트 파일을 생성하여 실행 가능한 상태까지 구현해주세요.

## 프로젝트 정보

- 프로젝트명: CNU CHA CHA STORE
- 서비스: 충남대학교 차차 굿즈 쇼핑몰
- 주요 고객: 충남대학교 재학생, 졸업생, 교직원 및 캐릭터 팬
- 기본 언어: 한국어
- 기본 통화: KRW (원)
- 기준 시간대: Asia/Seoul

## 디자인 콘셉트

- 귀엽고 세련된 캐릭터 굿즈 쇼핑몰
- 대학생 감성의 트렌디한 디자인
- 네이비와 화이트 중심의 컬러
- 차차 캐릭터를 활용한 포인트 디자인
- 둥근 모서리와 깔끔한 상품 카드
- PC 및 모바일 반응형 디자인

차차의 공식 이미지가 제공되지 않았다면 임의로 공식 캐릭터 이미지를 제작했다고 표현하지 마세요.

이미지 교체가 가능한 플레이스홀더를 사용하고 이미지 등록 기능을 구현해주세요.

---

# 2. 기술 스택

| 구분 | 기술 |
|---|---|
| Frontend | Next.js |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Charts | Recharts |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Storage | Supabase Storage |
| Payment | 토스페이먼츠 |
| Deployment | Vercel |
| Version Control | Git / GitHub |

최신 안정 버전을 사용하고 서로 호환되는 패키지를 설치해주세요.

---

# 3. 전체 사이트 구조

프로젝트는 고객용 쇼핑몰과 관리자 전용 사이트로 구성합니다.

## 고객용 쇼핑몰

URL: /

- 메인 페이지
- 상품 목록
- 카테고리
- 상품 상세
- 장바구니
- 주문 및 결제
- 회원가입
- 로그인
- 마이페이지
- 주문 내역

## 관리자 전용 사이트

URL: /admin

- 관리자 로그인
- 관리자 대시보드
- 상품 관리
- 주문 관리
- 판매 분석
- 제품별 판매 분석
- 재고 관리
- 고객 관리
- 한정판 관리
- 시스템 설정

두 영역은 레이아웃과 접근 권한을 분리합니다.

---

# 4. 상품 카테고리

다음 상품을 기본 상품 데이터로 등록해주세요.

## 4-1. 의류

- 차차 후드티
- 차차 양말

## 4-2. 문구

- 차차 메모지
- 시즌 한정 스티커

## 4-3. 잡화

- 맥세이프 그립톡
- 말랑 PVC 키링
- 차차 텀블러
- 랜덤 피규어
- 노트북 파우치
- 보조배터리
- 양치도구 세트
- 여행용 파우치 세트
- 차량 방향제
- 에코백

## 4-4. 한정판

- 커스텀 의상 차차 인형
- 시즌 한정 차차 인형
- 시즌 한정 스티커

각 상품에는 다음 정보를 포함합니다.

- 상품 ID
- 상품명
- 상품 코드
- 카테고리
- 상품 이미지
- 상품 설명
- 판매 가격
- 할인 가격
- 재고 수량
- 판매 상태
- 상품 옵션
- 누적 판매량
- 한정판 여부
- 판매 시작일
- 판매 종료일
- 등록일

상품 가격과 재고는 관리자가 수정할 수 있어야 합니다.

---

# 5. 고객용 쇼핑몰

## 5-1. 메인 페이지

상단 네비게이션:

- CHA CHA STORE 로고
- HOME
- SHOP
- BEST
- NEW
- LIMITED
- 로그인
- 장바구니

메인 페이지 구성:

1. 차차 캐릭터 메인 배너
2. 브랜드 소개
3. 인기 상품 TOP 5
4. 신상품 소개
5. 시즌 한정 상품 소개
6. 카테고리별 상품
7. 추천 상품
8. FOOTER

메인 배너에는 쇼핑하기 버튼을 배치합니다.

## 5-2. 상품 목록 페이지

기능:

- 카테고리별 상품 조회
- 상품명 검색
- 가격순 정렬
- 인기순 정렬
- 최신순 정렬
- 판매 상태 필터
- 한정판 필터
- 품절 상품 표시

상품 카드는 다음 정보를 표시합니다.

- 상품 이미지
- 상품명
- 가격
- 할인 가격
- 할인율
- 판매 상태
- 한정판 배지

## 5-3. 상품 상세 페이지

표시 정보:

- 상품 대표 이미지
- 상세 이미지
- 상품명
- 판매 가격
- 할인 가격
- 상품 설명
- 옵션 선택
- 수량 선택
- 재고 상태
- 장바구니 담기
- 구매하기

한정판 상품에는 다음 정보를 추가합니다.

- 한정판 배지
- 판매 기간
- 한정 수량
- 남은 재고
- 판매 종료 안내

## 5-4. 장바구니

기능:

- 상품 추가
- 상품 삭제
- 수량 변경
- 옵션 변경
- 상품별 금액 계산
- 총 결제 금액 계산
- 주문하기

재고가 부족한 경우 주문을 진행할 수 없도록 처리합니다.

## 5-5. 회원 시스템

Supabase Auth를 사용합니다.

기능:

- 회원가입
- 로그인
- 로그아웃
- 비밀번호 재설정
- 마이페이지
- 개인정보 수정
- 주문 내역
- 주문 상세 조회

## 5-6. 주문 및 결제

주문 정보:

- 주문번호
- 주문자
- 주문 상품
- 상품별 수량
- 상품별 가격
- 총 결제 금액
- 배송지
- 주문 일시
- 주문 상태
- 결제 상태

주문 상태:

- 결제 대기
- 결제 완료
- 상품 준비 중
- 배송 중
- 배송 완료
- 주문 취소
- 환불 완료

결제 기능은 토스페이먼츠 연동을 고려하여 구현합니다.

API 키가 없는 경우 실제 결제와 구분되는 테스트 모드를 제공합니다.

실제 결제 승인 및 검증은 서버에서 수행해야 합니다.

결제 완료 여부를 브라우저에서 전달하는 값만으로 판단하지 마세요.

---

# 6. 관리자 전용 시스템

URL: /admin

관리자 전용 사이트를 별도로 구현합니다.

일반 고객과 관리자는 서로 다른 권한을 가집니다.

## 6-1. 관리자 로그인

- 관리자 이메일 로그인
- 비밀번호 인증
- 로그아웃
- 세션 유지
- 권한 확인

관리자 권한이 없는 사용자는 관리자 페이지에 접근할 수 없어야 합니다.

다음 보안 기능을 적용합니다.

1. Supabase Auth 인증
2. 서버 측 관리자 권한 확인
3. 관리자 전용 API 권한 검증
4. Supabase RLS 적용
5. 일반 회원의 관리자 권한 변경 차단
6. 환경변수 및 API 키 보호

단순히 관리자 메뉴를 숨기는 방식으로 보안을 처리하지 마세요.

관리자 계정 생성 및 권한 부여는 안전한 별도 절차를 사용합니다.

---

# 7. 관리자 대시보드

URL: /admin/dashboard

로그인 직후 표시되는 메인 화면입니다.

전체 쇼핑몰 운영 현황을 한눈에 확인할 수 있도록 구성합니다.

## 7-1. 핵심 지표

상단에 다음 정보를 표시합니다.

- 총매출
- 오늘 매출
- 이번 달 매출
- 총 주문 건수
- 오늘 주문 건수
- 총 판매 수량
- 등록 상품 수
- 품절 상품 수

모든 지표는 실제 데이터베이스를 기반으로 계산합니다.

테스트용 데이터와 실제 판매 데이터를 명확히 구분합니다.

## 7-2. 매출 분석

Recharts를 사용하여 차트를 구현합니다.

- 일별 매출 추이
- 주별 매출 추이
- 월별 매출 추이
- 카테고리별 매출 비중
- 일별 주문 건수
- 상품별 매출 비교

기간 선택:

- 최근 7일
- 최근 30일
- 최근 90일
- 올해
- 직접 날짜 지정

## 7-3. 인기 상품 TOP 5

표시 항목:

- 순위
- 상품 이미지
- 상품명
- 카테고리
- 판매 수량
- 총매출

판매량 기준으로 자동 정렬합니다.

## 7-4. 최근 주문 내역

표시 항목:

- 주문번호
- 주문일
- 고객명
- 상품명
- 주문금액
- 주문상태

최신 주문이 위에 표시되도록 합니다.

---

# 8. 제품별 판매 분석

URL: /admin/sales

이번 프로젝트의 핵심 기능입니다.

각 상품의 주문 정보와 판매 정보를 종합적으로 확인할 수 있도록 구현합니다.

## 8-1. 전체 상품 판매 현황

표시 항목:

- 상품 이미지
- 상품명
- 카테고리
- 판매 가격
- 현재 재고
- 누적 판매 수량
- 오늘 판매 수량
- 이번 달 판매 수량
- 누적 매출
- 판매 상태

기능:

- 상품명 검색
- 카테고리 필터
- 기간별 검색
- 판매량 정렬
- 매출 정렬
- 재고 정렬

## 8-2. 개별 상품 상세 분석

URL: /admin/sales/[productId]

상품을 클릭하면 개별 분석 페이지로 이동합니다.

### 상품 기본 정보

- 상품 이미지
- 상품명
- 상품 코드
- 카테고리
- 판매 가격
- 현재 재고

### 판매 통계

- 누적 판매량
- 오늘 판매량
- 이번 달 판매량
- 총 주문 건수
- 누적 매출
- 취소 건수
- 환불 건수

### 그래프

- 일별 판매량
- 월별 판매량
- 기간별 매출
- 주문 추이

### 주문 내역

- 주문번호
- 주문일
- 고객명
- 주문 수량
- 주문 금액
- 주문 상태

### 추가 기능

- 기간별 검색
- 엑셀 다운로드
- 상품별 판매량 비교

취소 및 환불된 주문은 정상 판매량과 매출에서 정확하게 제외하거나 환불 금액을 차감합니다.

주문 상세 테이블을 기준으로 통계를 계산합니다.

주문 당시의 상품명과 가격을 보존하여 과거 판매 기록이 변경되지 않도록 합니다.

---

# 9. 상품 관리

URL: /admin/products

기능:

- 상품 등록
- 상품 수정
- 상품 삭제
- 상품 이미지 등록
- 상품 가격 수정
- 할인 가격 수정
- 재고 수량 변경
- 판매 상태 변경
- 카테고리 변경
- 옵션 관리
- 한정판 설정

상품 등록 항목:

- 상품명
- 상품 코드
- 카테고리
- 상품 설명
- 판매 가격
- 할인 가격
- 재고 수량
- 대표 이미지
- 상세 이미지
- 상품 옵션
- 판매 시작일
- 판매 종료일
- 한정판 여부

이미지는 Supabase Storage에 저장합니다.

삭제 시 기존 주문 기록과 연결된 상품 데이터가 사라지지 않도록 안전하게 처리합니다.

---

# 10. 주문 관리

URL: /admin/orders

기능:

- 전체 주문 조회
- 주문번호 검색
- 고객명 검색
- 날짜별 검색
- 상품별 검색
- 주문 상태별 필터

주문 상세 정보:

- 주문자 정보
- 배송지 정보
- 주문 상품 목록
- 상품별 수량
- 결제 금액
- 결제 상태
- 주문 상태

관리자 기능:

- 주문 상태 변경
- 배송 상태 변경
- 주문 취소 처리
- 환불 처리
- 배송 정보 입력

주문 상태 변경 이력을 관리할 수 있도록 합니다.

---

# 11. 재고 관리

URL: /admin/inventory

기능:

- 전체 재고 조회
- 상품별 재고 확인
- 입고 수량 등록
- 재고 수정
- 재고 부족 알림
- 품절 상품 확인
- 재고 변경 이력

재고가 일정 수량 이하로 내려가면 관리자 대시보드에 경고를 표시합니다.

재고 변경은 반드시 이력으로 기록합니다.

주문과 재고 변경은 데이터 정합성을 보장하도록 트랜잭션 기반으로 처리합니다.

동시에 여러 주문이 발생하더라도 재고가 음수가 되지 않도록 합니다.

---

# 12. 고객 관리

URL: /admin/customers

기능:

- 회원 목록
- 회원 검색
- 회원별 주문 내역
- 회원별 누적 구매 금액
- 회원별 구매 횟수
- 최근 구매일

개인정보는 관리자 권한에 따라 접근을 제한합니다.

불필요한 개인정보 노출을 방지합니다.

---

# 13. 한정판 관리

URL: /admin/limited

기능:

- 한정판 상품 등록
- 판매 기간 설정
- 한정 수량 설정
- 판매 시작 및 종료
- 판매 상태 관리
- 남은 수량 확인

한정판 상품의 재고가 0이 되면 자동으로 품절 처리합니다.

판매 종료일이 지나면 판매 종료 상태로 변경합니다.

---

# 14. 데이터베이스 설계

Supabase PostgreSQL을 사용합니다.

다음 테이블을 설계합니다.

## profiles

- id
- name
- email
- role
- created_at

## categories

- id
- name
- slug
- created_at

## products

- id
- name
- sku
- category_id
- description
- price
- sale_price
- stock
- image_url
- is_limited
- status
- created_at

## product_options

- id
- product_id
- option_name
- option_value
- additional_price

## orders

- id
- order_number
- user_id
- total_amount
- payment_status
- order_status
- shipping_address
- created_at

## order_items

- id
- order_id
- product_id
- product_name
- price
- quantity
- subtotal

## payments

- id
- order_id
- payment_key
- amount
- status
- paid_at

## inventory_movements

- id
- product_id
- movement_type
- quantity
- reason
- created_at

## limited_products

- id
- product_id
- start_at
- end_at
- limited_quantity

필요한 경우 다음 테이블도 추가합니다.

- carts
- cart_items
- order_status_history
- payment_refunds
- shipping_info
- product_images
- admin_activity_logs

데이터베이스 마이그레이션 파일을 생성합니다.

Supabase RLS 정책을 설정합니다.

관리자 권한은 일반 회원이 임의로 변경할 수 없도록 합니다.

주문과 재고 변경은 트랜잭션 및 데이터베이스 함수를 활용합니다.

주문 상세에는 주문 당시의 상품명과 가격을 별도로 저장합니다.

---

# 15. UI 디자인

## 고객용 쇼핑몰

- 캐릭터 중심의 귀여운 디자인
- 깔끔한 상품 카드
- 큰 상품 이미지
- 직관적인 카테고리 메뉴
- 모바일 최적화
- 네이비 및 화이트 중심 컬러

## 관리자 사이트

- SaaS 스타일 관리자 대시보드
- 좌측 고정 사이드바
- 상단 헤더
- 통계 카드
- 매출 그래프
- 데이터 테이블
- 검색 및 필터

관리자 사이드바:

DASHBOARD
- 대시보드

STORE MANAGEMENT
- 상품 관리
- 주문 관리
- 판매 분석
- 재고 관리

CUSTOMER
- 고객 관리

SPECIAL
- 한정판 관리

SYSTEM
- 설정
- 로그아웃

---

# 16. 프로젝트 폴더 구조

다음 구조를 기준으로 구현합니다.

src/
├── app/
│   ├── (store)/
│   │   ├── page.tsx
│   │   ├── products/
│   │   ├── categories/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── mypage/
│   │
│   ├── admin/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── sales/
│   │   ├── inventory/
│   │   ├── customers/
│   │   └── limited/
│   │
│   └── api/
│
├── components/
│   ├── store/
│   ├── admin/
│   └── common/
│
├── lib/
│   ├── supabase/
│   └── utils/
│
├── hooks/
│
└── types/

supabase/
├── migrations/
└── seed.sql

public/
└── images/
    ├── chacha/
    └── products/

---

# 17. 추가 필수 사항

1. 모든 화면은 한국어로 제작합니다.
2. 가격은 원화로 표시합니다.
3. 날짜는 한국 시간 기준으로 처리합니다.
4. 모든 페이지는 반응형으로 제작합니다.
5. 데이터가 없을 때 안내 문구를 표시합니다.
6. 로딩 및 오류 상태를 구현합니다.
7. 사용자 입력값 검증을 적용합니다.
8. 데이터베이스 접근은 서버 측 권한 검증을 거칩니다.
9. 관리자 API는 별도로 권한을 검증합니다.
10. 비밀번호 및 API 키를 소스코드에 작성하지 않습니다.
11. .env.example 파일을 생성합니다.
12. README.md에 설치 및 실행 방법을 작성합니다.
13. 데이터베이스 초기화 SQL을 제공합니다.
14. 테스트용 상품 데이터를 제공합니다.
15. 관리자 계정 생성 및 권한 부여 방법을 문서화합니다.
16. 결제 API 키가 없으면 테스트 모드로 동작합니다.
17. 실제 결제와 테스트 결제를 명확하게 구분합니다.
18. 개인정보 및 결제 정보를 안전하게 처리합니다.

---

# 18. Git 버전 관리 및 자동 Commit 규칙

본 프로젝트는 Git 버전 관리를 필수적으로 수행합니다.

가장 중요한 규칙은 새로운 기능을 구현할 때마다 개별 Git Commit을 생성하는 것입니다.

기능 단위로 개발하고 테스트한 후 반드시 Commit을 수행합니다.

## 18-1. 기본 원칙

1. 기능 하나를 완성할 때마다 Git Commit 수행
2. Commit 전에 해당 기능 테스트
3. 테스트가 실패하면 수정 후 재테스트
4. 서로 다른 기능을 하나의 Commit으로 묶지 않기
5. 기존 Commit을 임의로 수정하거나 삭제하지 않기
6. Commit 메시지는 기능을 명확하게 설명
7. API 키와 비밀번호 등 민감한 정보는 Commit 금지
8. 사용자 승인 없이 Git Push를 수행하지 않기
9. 기존 작업 내용을 임의로 삭제하지 않기
10. Commit 전 Git 상태를 확인하기

프로젝트에 이미 Git 저장소가 초기화되어 있다면 git init을 반복하지 않습니다.

## 18-2. Commit 메시지 규칙

Conventional Commits 규칙을 사용합니다.

형식:

<type>: <description>

사용할 Type:

- feat: 새로운 기능 추가
- fix: 오류 수정
- style: 디자인 및 UI 변경
- refactor: 코드 구조 개선
- docs: 문서 수정
- chore: 환경 설정 및 패키지 관리
- test: 테스트 코드 추가

모든 Commit 메시지는 영어로 작성합니다.

## 18-3. 기능별 Commit 계획

### 초기 설정

chore: initialize Next.js project

chore: configure Tailwind CSS and dependencies

chore: setup project folder structure

chore: configure Supabase environment

### 쇼핑몰 디자인

feat: implement global layout and navigation

feat: implement main landing page

feat: implement product category pages

feat: implement product detail pages

style: improve responsive shopping mall UI

### 상품 기능

feat: implement product search and filtering

feat: implement product sorting

feat: implement product options and quantity selection

feat: implement shopping cart

### 회원 및 주문

feat: implement user authentication

feat: implement user mypage

feat: implement order management

feat: implement checkout process

### 관리자 시스템

feat: implement admin authentication

feat: implement admin dashboard

feat: implement product management

feat: implement order management dashboard

feat: implement product sales analytics

feat: implement inventory management

feat: implement customer management

feat: implement limited edition management

### 통계 및 데이터

feat: implement sales charts

feat: implement product performance analytics

feat: implement sales data export

fix: improve sales and refund calculations

### 최종 작업

test: add application tests

fix: resolve TypeScript and build errors

docs: complete project documentation

위 목록은 기본 계획이며 실제 개발 과정에서 기능이 추가되거나 분리되면 적절한 Commit을 추가합니다.

## 18-4. Commit 실행 절차

각 기능을 개발할 때 다음 순서를 반드시 지킵니다.

STEP 1.
기능 구현

STEP 2.
관련 코드 검토

STEP 3.
기능 정상 작동 여부 테스트

STEP 4.
TypeScript 및 ESLint 오류 확인

STEP 5.
Git 변경 사항 확인

git status

STEP 6.
변경 파일 추가

git add <관련 파일>

STEP 7.
기능별 Commit 수행

git commit -m "feat: implement product management"

STEP 8.
Commit 성공 여부 확인

git log -1 --oneline

STEP 9.
다음 기능 개발 시작

기능 구현이 끝나지 않았거나 테스트가 실패했다면 완료된 것으로 간주하지 않습니다.

## 18-5. Commit 실패 처리

Commit 과정에서 문제가 발생하면 다음과 같이 처리합니다.

- Git 충돌 발생 시 원인 확인
- 테스트 실패 시 수정 후 재테스트
- Commit 실패 시 원인 해결 후 재시도
- 민감한 정보가 포함된 파일은 제외
- 기존 작업 내용을 임의로 삭제하지 않기

## 18-6. Git 작업 결과 보고

각 기능 구현이 끝날 때마다 다음 정보를 보고합니다.

- 구현한 기능
- 테스트 결과
- Commit 메시지
- Commit Hash
- 다음 개발 예정 기능

보고 예시:

[Git Commit 완료]

기능: 상품 관리 시스템

Commit:
feat: implement product management

Commit Hash:
a1b2c3d

테스트:
PASS

다음 작업:
주문 관리 시스템 구현

## 18-7. Git 최종 검증

모든 개발이 완료되면 다음 명령어를 실행합니다.

git status

git log --oneline

다음 사항을 확인합니다.

- 각 기능별 Commit 존재 여부
- Commit 메시지 확인
- 민감한 정보가 Commit되지 않았는지 확인
- 미완료 작업 확인
- 의도하지 않은 변경 사항 확인

중요:

여러 기능을 구현한 다음 한꺼번에 Commit하지 마세요.

반드시 기능 하나를 완성하고 테스트한 다음 Git Commit을 수행하고 다음 기능으로 넘어갑니다.

Git Push는 사용자의 명시적인 승인 없이는 진행하지 않습니다.

---

# 19. 개발 실행 순서

다음 순서대로 실제 개발을 진행합니다.

STEP 1.
Next.js 프로젝트 초기화

STEP 2.
필요한 패키지 설치

STEP 3.
공통 레이아웃 및 디자인 시스템 제작

STEP 4.
고객용 쇼핑몰 제작

STEP 5.
상품 데이터 구조 구축

STEP 6.
Supabase 연동

STEP 7.
회원가입 및 로그인 구현

STEP 8.
장바구니 및 주문 기능 구현

STEP 9.
관리자 인증 및 권한 관리 구현

STEP 10.
관리자 대시보드 제작

STEP 11.
제품별 판매 분석 기능 제작

STEP 12.
주문 및 재고 관리 기능 제작

STEP 13.
한정판 관리 기능 제작

STEP 14.
전체 기능 테스트

STEP 15.
오류 수정

STEP 16.
Git 최종 검증

STEP 17.
최종 실행 확인

각 단계의 기능 구현이 끝날 때마다 반드시 테스트하고 Git Commit을 수행합니다.

다음 단계로 넘어가기 전에 이전 단계의 Commit이 완료되었는지 확인합니다.

---

# 20. 최종 완료 조건

다음 항목을 모두 확인합니다.

## 고객용 쇼핑몰

- 메인 페이지 정상 출력
- 상품 목록 정상 출력
- 상품 상세 페이지 정상 출력
- 검색 및 필터 정상 작동
- 장바구니 정상 작동
- 회원 인증 정상 작동
- 주문 기능 정상 작동

## 관리자용 시스템

- 관리자 로그인 정상 작동
- 일반 회원 접근 차단
- 관리자 대시보드 출력
- 매출 데이터 조회
- 상품 등록 및 수정
- 주문 관리
- 제품별 판매 통계
- 재고 관리
- 한정판 관리
- 고객 관리

## 기술 검증

- TypeScript 오류 해결
- ESLint 오류 해결
- 빌드 성공
- 데이터베이스 연결 확인
- RLS 정책 확인
- 관리자 권한 검증 확인
- 주요 기능 테스트 통과
- Git Commit 내역 확인

---

# 21. 최종 실행 및 보고

모든 개발이 끝나면 다음 명령어로 실행할 수 있도록 합니다.

npm run dev

접속 주소:

고객용 쇼핑몰:
http://localhost:3000

관리자 페이지:
http://localhost:3000/admin

최종 완료 후 다음 내용을 보고합니다.

1. 구현 완료된 기능
2. 실행 방법
3. 환경변수 설정 방법
4. Supabase 연결 방법
5. 관리자 계정 생성 방법
6. 추가로 필요한 API 키
7. 아직 구현되지 않은 기능
8. Git Commit 전체 내역
9. 테스트 결과
10. 배포 방법

중요:

단순히 코드 예시만 제공하지 마세요.

실제 프로젝트 파일을 생성하고 필요한 패키지를 설치하며 데이터베이스 연결 및 기능 구현까지 진행합니다.

실행 가능한 상태로 완성해주세요.

모든 기능은 실제 데이터 흐름을 기반으로 동작해야 합니다.

기능별 테스트와 Git Commit을 반드시 수행해주세요.