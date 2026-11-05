# Scripts Directory Guide

이 디렉터리는 CNU ChaCha Store의 유틸리티 및 빌드 도구를 관리하는 공간입니다.

## 📁 파일 구조

```
scripts/
├── serve_out.js     # [운영용] next build 생성물(out/ 정적 디렉터리)을 로컬(포트 3000)에서 서빙하는 HTTP 서버
├── archive/         # [참고/보관용] 개발 초기 굿즈 이미지 3D 렌더링 및 목업 일회성 변환 스크립트 모음
└── README.md        # 스크립트 안내 문서
```

## 🚀 주요 명령어

### 로컬 정적 빌드 서버 실행
```bash
node scripts/serve_out.js
# 또는
npm run serve
```
* **용도**: `npm run build`로 생성된 `out/` 폴더를 로컬 `http://localhost:3000`에서 브라우저 캐시 없이 깨끗하게 테스트 검증할 때 사용합니다.
* **특징**: `.html` 자동 매핑, `Cache-Control: no-cache` 헤더 적용, 모든 MIME 타입 정적 스트리밍 지원.

---

## 📦 `archive/` 디렉터리 안내
* `GenerateGoods.cs`: C# .NET GDI+ 기반 3D 스튜디오 조명 및 라운드 굿즈 목업 렌더링 엔진 (참고용)
* `*.ps1`, `update_*.js`: 초기 목업 데이터 매핑 및 일회성 변환 스크립트로, 현재 프로젝트 빌드에는 영향을 미치지 않는 보관용 파일입니다.
