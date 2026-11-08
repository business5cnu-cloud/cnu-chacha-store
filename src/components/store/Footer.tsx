import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Clock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400 text-slate-950 font-black">
                C
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight">
                CNU CHA CHA STORE
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
              충남대학교 마스코트 &lsquo;차차(CHA CHA)&rsquo; 공식 굿즈 쇼핑몰입니다.
              재학생, 졸업생, 교직원 그리고 차차를 사랑하는 모든 팬들을 위한 캠퍼스 라이프스타일 브랜드입니다.
            </p>
            <div className="mt-4 space-y-1.5 text-xs text-slate-400">
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-sky-400" />
                (34134) 대전광역시 유성구 대학로 99 충남대학교 굿즈스토어 운영센터
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-sky-400" />
                고객센터: 042-821-5114 (이메일: store@cnu-chacha.kr)
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-sky-400" />
                운영시간: 평일 09:00 ~ 18:00 (점심시간 12:00 ~ 13:00 / 주말·공휴일 휴무)
              </p>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              SHOP CATEGORIES
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  전체 상품 보기
                </Link>
              </li>
              <li>
                <Link href="/categories/apparel" className="hover:text-white transition-colors">
                  의류 (후드티 · 양말)
                </Link>
              </li>
              <li>
                <Link href="/categories/stationery" className="hover:text-white transition-colors">
                  문구 (메모지 · 스티커)
                </Link>
              </li>
              <li>
                <Link href="/categories/accessories" className="hover:text-white transition-colors">
                  잡화 (키링 · 텀블러 · 파우치)
                </Link>
              </li>
              <li>
                <Link href="/categories/limited" className="text-rose-400 hover:text-rose-300 font-semibold">
                  한정판 스페셜 에디션
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer & Admin */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              MY ACCOUNT
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/mypage" className="hover:text-white transition-colors">
                  마이페이지 / 주문내역
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  장바구니
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  회원 로그인 / 회원가입
                </Link>
              </li>

            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 CNU CHA CHA STORE. All rights reserved. 기준 시간대: Asia/Seoul (KST)</p>
          <p>
            * 본 사이트의 캐릭터 이미지는 공식 에셋 등록 전까지 교체 가능한 플레이스홀더를 사용하며 관리자 페이지에서 즉시 등록·교체할 수 있습니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
