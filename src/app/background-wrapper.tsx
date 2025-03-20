"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface BackgroundWrapperProps {
  children: ReactNode;
}

export default function BackgroundWrapper({ children }: BackgroundWrapperProps) {
  const pathname = usePathname();
  
  // 确定哪些路由需要白色背景
  const whiteBackgroundRoutes = ["/memo-cards", "/word-cards", "/daily-report"];
  const isWhiteBackground = whiteBackgroundRoutes.some(route => pathname.includes(route));
  
  // 根据路由设置背景颜色
  const bgColor = isWhiteBackground ? "bg-white" : "bg-[#f5f5f5]";
  const darkBgColor = isWhiteBackground ? "dark:bg-white" : "dark:bg-bgDark";

  return (
    <div className={`min-h-screen w-full ${bgColor} ${darkBgColor}`}>
      {children}
    </div>
  );
} 