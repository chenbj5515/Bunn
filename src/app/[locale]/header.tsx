"use client"
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// import { useDispatch } from 'react-redux';
// import { clearLocalCards } from '@/store/local-cards-slice';
import "remixicon/fonts/remixicon.css";
// import { Footer } from './footer';
// import BrandIcon from "@/components/brand-icon"
import { LanguageSelector } from "@/components/language-selector"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { useState } from "react"
import UserPanel from "@/components/user-panel"
import { useAudioPermission } from "@/hooks/audio"
import { localCardListAtom } from '@/lib/atom';
import { useSetAtom } from 'jotai';

export default function ClientLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const setLocalCardList = useSetAtom(localCardListAtom);
    // const dispatch = useDispatch();

    const currentRoute = pathname.split('/').pop() || '';

    const noNavPaths = ["exam", "login", "payment-result"];
    const noNav = noNavPaths.includes(currentRoute);

    const unloginHeaderPaths = ["home", "guide", "pricing", "privacy-policy", "terms-of-service", "business-disclosure"];
    const unloginHeader = unloginHeaderPaths.includes(currentRoute);

    useEffect(() => {
      setLocalCardList([]);
    }, [pathname]);

    return (
        <>
            {
                unloginHeader
                    ? <UnloginHeader />
                    : noNav
                        ? null
                        : <LoginedHeader />
            }
            <div style={{
                paddingTop: noNav ? 0 : "64px",
                paddingBottom: unloginHeader ? "100px" : 0
            }}>
                {children}
            </div>
            {
                // unloginHeader ? <Footer /> : null
            }
        </>
    )
}

function UnloginHeader() {
    const router = useRouter()
    const t = useTranslations();

    return (
        <nav className="top-0 z-10 fixed flex justify-between items-center px-0 w-full h-[86px]">
            <div className="flex items-center gap-4 pl-4">
                {/* <BrandIcon size="large" /> */}
            </div>
            <div className="flex items-center gap-8 pr-14 font-medium">
                <LanguageSelector />
                <button
                    onClick={() => router.push('/guide')}
                    className="text-black hover:text-[#595a5d] transition-colors"
                >
                    {t('common.guide')}
                </button>
                <button
                    onClick={() => router.push('/pricing')}
                    className="text-black hover:text-[#595a5d] transition-colors"
                >
                    {t('common.pricing')}
                </button>
                <button
                    onClick={() => window.location.href = 'mailto:chenbj55150220@gmail.com'}
                    className="text-black hover:text-[#595a5d] transition-colors"
                >
                    {t('common.contact')}
                </button>
            </div>
        </nav>
    )
}

function LoginedHeader() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('LoginedHeader')
  const [theme, setTheme] = useState("light")
  useAudioPermission();

  function handleToggle() {
    if (theme === "dark") {
      setTheme("light")
    } else {
      setTheme("dark") 
    }
    document.body.classList.toggle("dark")
  }

  return (
    <header className="top-0 z-[200] fixed flex justify-between items-center backdrop-blur-[3px] backdrop-saturate-[180%] p-[12px] w-full h-[64px]">
      <UserPanel />
      <nav className="w-[620px]">
        <ul className="flex justify-between items-center">
          <li>
            <Link prefetch href={`/${locale}/memo-cards`} className={`text-[15px] font-medium px-4 py-2 rounded-full ${pathname === `/${locale}/memo-cards` ? 'text-[#a9aaab]' : 'hover:text-[#a9aaab]'}`}>{t('memoCards')}</Link>
          </li>
          <li>
            <Link href={`/${locale}/word-cards`} className={`text-[15px] font-medium px-4 py-2 rounded-full ${pathname === `/${locale}/word-cards` ? 'text-[#a9aaab]' : 'hover:text-[#a9aaab]'}`}>{t('wordCards')}</Link>
          </li>
          {/* <li className="hidden sm:block">
            <Link prefetch href={`/${locale}/exam-preparation`} className={`text-[15px] font-medium px-4 py-2 rounded-full ${pathname === `/${locale}/exam-preparation` ? 'text-[#a9aaab]' : 'hover:text-[#a9aaab]'}`}>{t('exam')}</Link>
          </li> */}
          <li className="hidden sm:block">
            <Link prefetch href={`/${locale}/daily-report`} className={`text-[15px] font-medium px-4 py-2 rounded-full ${pathname.startsWith(`/${locale}/daily-report`) ? 'text-[#a9aaab]' : 'hover:text-[#a9aaab]'}`}>{t('dailyReport')}</Link>
          </li>
        </ul>
      </nav>
      <label className="hidden md:inline-block relative w-[56px] h-[28px] text-base">
        <input
          onChange={handleToggle}
          checked={theme === "light"}
          className="peer opacity-0 w-0 h-0"
          type="checkbox"
        />
        <span className="top-1 left-2 z-[1] absolute shadow-crescent peer-checked:shadow-full-moon rounded-full w-5 h-5 transition peer-checked:translate-x-5 duration-300 ease-in-out"></span>
        <span className="top-0 right-0 bottom-0 left-0 absolute bg-black peer-checked:bg-blue rounded-3xl transition duration-500 cursor-pointer"></span>
      </label>
    </header>
  )
}
