'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Boxes,
  Users,
  Sparkles,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';

interface NavGroup {
  groupTitle: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: 'DASHBOARD',
    items: [{ label: '대시보드', href: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    groupTitle: 'STORE MANAGEMENT',
    items: [
      { label: '상품 관리', href: '/admin/products', icon: Package },
      { label: '주문 관리', href: '/admin/orders', icon: ShoppingCart },
      { label: '판매 분석', href: '/admin/sales', icon: BarChart3 },
      { label: '재고 관리', href: '/admin/inventory', icon: Boxes },
    ],
  },
  {
    groupTitle: 'CUSTOMER',
    items: [{ label: '고객 관리', href: '/admin/customers', icon: Users }],
  },
  {
    groupTitle: 'SPECIAL',
    items: [{ label: '한정판 관리', href: '/admin/limited', icon: Sparkles }],
  },
  {
    groupTitle: 'SYSTEM',
    items: [{ label: '설정', href: '/admin/settings', icon: Settings }],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useStore();

  const handleAdminLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-300">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400 text-slate-950 font-black">
            C
          </div>
          <div>
            <span className="block text-sm font-black text-white leading-none">
              CHA CHA ADMIN
            </span>
            <span className="text-[10px] font-semibold text-sky-400">
              BACKOFFICE SYSTEM
            </span>
          </div>
        </Link>
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.groupTitle} className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              {group.groupTitle}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}

        {/* Logout inside SYSTEM */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleAdminLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>로그아웃</span>
          </button>
        </div>
      </nav>

      {/* Bottom Store Shortcut */}
      <div className="border-t border-slate-800 p-4">
        <Link
          href="/"
          className="flex items-center justify-between rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800"
        >
          <span>고객용 쇼핑몰 보기</span>
          <ExternalLink className="h-3.5 w-3.5 text-sky-400" />
        </Link>
      </div>
    </aside>
  );
}
