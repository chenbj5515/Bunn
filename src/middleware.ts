import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './lib/auth';

export default createMiddleware(routing);

const locales = ['en', 'zh', 'zh-TW'];

// 获取并设置用户语言偏好
function getAndSetLocale(request: NextRequest): string {
  // 检查 Cookie 中是否有语言偏好
  const localeCookie = request.cookies.get('NEXT_LOCALE');
  if (localeCookie?.value && locales.includes(localeCookie.value)) {
    return localeCookie.value;
  }

  // 获取系统语言偏好
  const acceptLanguage = request.headers.get('accept-language') || '';
  const systemLocale = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();

  // 确定最终使用的语言
  const finalLocale = locales.includes(systemLocale) ? systemLocale : 'en';

  // 创建响应对象来设置 cookie
  const response = NextResponse.next();
  response.cookies.set('NEXT_LOCALE', finalLocale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 一年有效期
    sameSite: 'lax'
  });

  return finalLocale;
}


export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};

export async function middleware(req: NextRequest) {
  const session = await getSession();
  const locale = getAndSetLocale(req);
  const pathname = req.nextUrl.pathname;

  // 处理根路由重定向
  if (pathname === '/') {
    // 从Cookie中获取会话信息
    if (session) {
      return NextResponse.redirect(new URL(`/${locale}/home`, req.url));
    }

    // const redirectParam = req.nextUrl.searchParams.get('redirect');
    // if (redirectParam) {
    //   const redirectPath = redirectParam.startsWith('/') ? redirectParam : `/${redirectParam}`;
    //   return NextResponse.redirect(new URL(`/${locale}${redirectPath}`, req.url));
    // }
    // return NextResponse.redirect(new URL(`/${locale}/memo-cards`, req.url));
  }

  console.log(session, 'session');
  console.log('middleware');
}