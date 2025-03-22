import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getSession } from '@/lib/auth';
import { trackTokenCount, countTokens, checkTokenLimit, getUserTokenLimit } from '@/utils/token-tracker';
import { after } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ success: false, error: '未配置 OpenAI API 密钥' }, { status: 500 });
    }

    // 获取用户会话
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: '用户未授权' }, { status: 401 });
    }

    const userId = session.user.id;

    // 尝试获取请求体
    let body;
    try {
      const contentType = req.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        body = await req.json();
      } else {
        const text = await req.text();
        body = JSON.parse(text);
      }
    } catch (e: unknown) {
      return NextResponse.json({ success: false, error: '无法解析请求体' }, { status: 400 });
    }

    const { prompt, model = 'gpt-4o' } = body;

    if (!prompt) {
      return NextResponse.json({ success: false, error: '缺少必要的 prompt 参数' }, { status: 400 });
    }

    // 获取用户token限额
    const limit = await getUserTokenLimit(userId);

    // 检查是否超过限额
    const isWithinLimit = await checkTokenLimit(userId, limit);
    if (!isWithinLimit) {
      return NextResponse.json({
        success: false,
        error: '您已达到本日token使用限制'
      }, { status: 403 });
    }

    // 使用 ai-sdk 的 openaiClient 替代直接 fetch
    const result = await generateText({
      model: openai(model),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    // 从AI SDK返回的响应中获取使用情况
    // 检查response对象并安全地访问属性
    const responseBody = result.response?.body as any;
    const usage = responseBody?.usage;
    let inputTokens = usage.prompt_tokens || 1000;
    let outputTokens = usage.completion_tokens || 1000;
    console.log(`API返回token使用: 输入=${inputTokens}, 输出=${outputTokens}, 总计=${usage.total_tokens || 0}`);

    // 使用 after 在响应完成后异步记录 token 使用情况
    after(async () => {
      await trackTokenCount({
        userId,
        inputTokens,
        outputTokens,
        model
      });
    });

    return NextResponse.json({
      success: true,
      data: result.text
    });
  } catch (err: unknown) {
    console.error('处理请求时发生错误:', err instanceof Error ? err.message : '未知错误');
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : '处理请求时发生错误',
        stack: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
} 