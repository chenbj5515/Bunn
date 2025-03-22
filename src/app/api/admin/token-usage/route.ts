import { NextRequest, NextResponse } from 'next/server';
import { getUserTokenStats, setUserTokenLimit } from '@/utils/token-tracker';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

// 检查用户是否为管理员
// async function isAdmin(userId: string): Promise<boolean> {
//   // 这里根据实际应用逻辑检查用户是否为管理员
//   // 简单判断：如果用户ID是项目创建者或特定管理员ID
//   const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
//   return adminIds.includes(userId);
// }

// 获取用户token使用情况
export async function GET(req: NextRequest) {
  try {
    // 验证管理员权限
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: '用户未登录' }, { status: 401 });
    }
    
    // const isUserAdmin = await isAdmin(session.user.id);
    // if (!isUserAdmin) {
    //   return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });
    // }
    
    // 获取用户ID
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ success: false, error: '缺少userId参数' }, { status: 400 });
    }
    
    // 获取用户统计信息
    const stats = await getUserTokenStats(userId);
    
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('获取token使用情况失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// 设置用户token限额
export async function POST(req: NextRequest) {
  try {
    // 验证管理员权限
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: '用户未登录' }, { status: 401 });
    }
    
    // const isUserAdmin = await isAdmin(session.user.id);
    // if (!isUserAdmin) {
    //   return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });
    // }
    
    // 解析请求体
    const body = await req.json();
    const { userId, limit } = body;
    
    if (!userId || typeof limit !== 'number') {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要参数：userId和limit' 
      }, { status: 400 });
    }
    
    // 设置用户限额
    await setUserTokenLimit(userId, limit);
    
    return NextResponse.json({ 
      success: true, 
      message: `已成功设置用户 ${userId} 的token限额为 ${limit}`
    });
  } catch (error) {
    console.error('设置token限额失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 