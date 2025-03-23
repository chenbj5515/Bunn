import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getSession } from '@/lib/auth';
import { trackTokenCount, checkTokenLimit, getUserTokenLimit } from '@/utils/token-tracker';
import { after } from 'next/server';

// 错误码定义
const ERROR_CODES = {
  // 认证相关错误 (1000-1999)
  UNAUTHORIZED: 1001,
  
  // 输入相关错误 (2000-2999)
  INVALID_REQUEST_BODY: 2001,
  MISSING_PARAMETERS: 2002,
  
  // 限制相关错误 (3000-3999)
  TOKEN_LIMIT_EXCEEDED: 3001,
  
  // API相关错误 (4000-4999)
  OPENAI_API_KEY_MISSING: 4001,
  OPENAI_API_ERROR: 4002,
  
  // 服务器错误 (5000-5999)
  INTERNAL_SERVER_ERROR: 5001
};

export async function POST(req: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ 
        success: false, 
        error: '未配置 OpenAI API 密钥',
        errorCode: ERROR_CODES.OPENAI_API_KEY_MISSING 
      }, { status: 500 });
    }

    // 获取用户会话
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        error: '用户未授权',
        errorCode: ERROR_CODES.UNAUTHORIZED 
      }, { status: 401 });
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
      return NextResponse.json({ 
        success: false, 
        error: '无法解析请求体',
        errorCode: ERROR_CODES.INVALID_REQUEST_BODY 
      }, { status: 400 });
    }

    const { prompt, model = 'gpt-4o' } = body;

    if (!prompt) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要的 prompt 参数',
        errorCode: ERROR_CODES.MISSING_PARAMETERS 
      }, { status: 400 });
    }

    // 获取用户token限额
    const limit = await getUserTokenLimit(userId);

    // 检查是否超过限额
    const isWithinLimit = await checkTokenLimit(userId, limit);
    if (!isWithinLimit) {
      return NextResponse.json({
        success: false,
        error: '您已达到本日token使用限制',
        errorCode: ERROR_CODES.TOKEN_LIMIT_EXCEEDED
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
    const responseBody = result.response?.body as Record<string, unknown>;
    const usage = responseBody?.usage as Record<string, number>;
    const inputTokens = usage.prompt_tokens || 1000;
    const outputTokens = usage.completion_tokens || 1000;
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
    
    // 根据错误类型返回不同的错误码和状态码
    let statusCode = 500;
    let errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
    let errorMessage = '服务器内部错误';
    
    if (err instanceof Error) {
      errorMessage = err.message;
      
      // 识别特定类型的错误
      if (errorMessage.includes('API key')) {
        errorCode = ERROR_CODES.OPENAI_API_ERROR;
        errorMessage = 'OpenAI API密钥错误';
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        errorCode = ERROR_CODES.OPENAI_API_ERROR;
        statusCode = 429;
        errorMessage = 'OpenAI API请求超过速率限制';
      } else if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
        errorCode = ERROR_CODES.UNAUTHORIZED;
        statusCode = 401;
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        errorCode: errorCode,
        stack: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.stack : undefined) : undefined
      },
      { status: statusCode }
    );
  }
} 