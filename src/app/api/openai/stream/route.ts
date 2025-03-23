import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getSession } from '@/lib/auth';
import { checkTokenLimit, getUserTokenLimit, trackTokenCount, countTokens } from '@/utils/token-tracker';
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
        error: '服务器未配置 OpenAI API Key',
        errorCode: ERROR_CODES.OPENAI_API_KEY_MISSING 
      }, { status: 400 });
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

    // 从请求体中获取数据
    const requestBody = await req.json().catch(() => ({}));
    const prompt = requestBody.prompt;
    const model = requestBody.model || 'gpt-4o';

    if (!prompt) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要参数 prompt',
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

    // 使用 Vercel AI SDK 创建流式响应
    const result = streamText({
      model: openai(model),
      messages: [{ role: 'user', content: prompt }],
    });

    // 使用一个变量收集完整响应
    let fullResponse = '';

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        for await (const delta of result.textStream) {
          fullResponse += delta; // 收集响应
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ delta })}\n\n`));
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));

        const inputTokens = countTokens(prompt, model);
        const outputTokens = countTokens(fullResponse, model);
        console.log(`估算token使用: 输入=${inputTokens}, 输出=${outputTokens}`);
        // 使用 after 在响应完成后异步记录 token 使用情况
        after(async () => {
          await trackTokenCount({
            userId,
            inputTokens,
            outputTokens,
            model
          });
        });

        controller.close();
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: unknown) {
    console.error('流式响应错误:', err instanceof Error ? err.message : '未知错误');
    
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