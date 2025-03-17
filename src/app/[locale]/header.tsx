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
import { useAudioPermission } from "@/hooks/use-audio-permission"

export default function ClientLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const pathname = usePathname();
    // const dispatch = useDispatch();

    const currentRoute = pathname.split('/').pop() || '';

    const noNavPaths = ["exam", "login", "payment-result"];
    const noNav = noNavPaths.includes(currentRoute);

    const unloginHeaderPaths = ["home", "guide", "pricing", "privacy-policy", "terms-of-service", "business-disclosure"];
    const unloginHeader = unloginHeaderPaths.includes(currentRoute);

    // useEffect(() => {
    //     dispatch(
    //         clearLocalCards()
    //     );
    // }, [pathname]);

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
                paddingTop: noNav ? 0 : "86px",
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
        <nav className="flex fixed top-0 items-center justify-between w-full px-0 h-[86px] z-10">
            <div className="flex items-center gap-4 pl-4">
                {/* <BrandIcon size="large" /> */}
            </div>
            <div className="flex items-center gap-8 font-medium pr-14">
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
    <header className="p-[12px] backdrop-blur-[3px] backdrop-saturate-[180%] justify-between items-center w-full fixed z-[200] top-0 flex">
      <UserPanel />
      <nav className="w-[620px]">
        <ul className="flex items-center justify-between">
          <li>
            <Link prefetch href={`/${locale}/memo-cards`} className={`text-[15px] font-medium px-4 py-2 rounded-full ${pathname === `/${locale}/memo-cards` ? 'text-[#a9aaab]' : 'hover:text-[#a9aaab]'}`}>{t('memoCards')}</Link>
          </li>
          <li>
            <Link href={`/${locale}/word-cards`} className={`text-[15px] font-medium px-4 py-2 rounded-full ${pathname === `/${locale}/word-cards` ? 'text-[#a9aaab]' : 'hover:text-[#a9aaab]'}`}>{t('wordCards')}</Link>
          </li>
          <li className="sm:block hidden">
            <Link prefetch href={`/${locale}/exam-preparation`} className={`text-[15px] font-medium px-4 py-2 rounded-full ${pathname === `/${locale}/exam-preparation` ? 'text-[#a9aaab]' : 'hover:text-[#a9aaab]'}`}>{t('exam')}</Link>
          </li>
          <li className="sm:block hidden">
            <Link prefetch href={`/${locale}/daily-report`} className={`text-[15px] font-medium px-4 py-2 rounded-full ${pathname.startsWith(`/${locale}/daily-report`) ? 'text-[#a9aaab]' : 'hover:text-[#a9aaab]'}`}>{t('dailyReport')}</Link>
          </li>
        </ul>
      </nav>
      <label className="hidden md:inline-block text-base relative w-[56px] h-[28px]">
        <input
          onChange={handleToggle}
          checked={theme === "light"}
          className="peer opacity-0 w-0 h-0"
          type="checkbox"
        />
        <span className="transition duration-300 ease-in-out peer-checked:translate-x-5 peer-checked:shadow-full-moon left-2 top-1 rounded-full shadow-crescent absolute h-5 w-5 z-[1]"></span>
        <span className="peer-checked:bg-blue absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-black transition duration-500 rounded-3xl"></span>
      </label>
    </header>
  )
}
