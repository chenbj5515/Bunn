import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getSession } from '@/lib/auth';
import { checkTokenLimit, getUserTokenLimit, trackTokenCount, countTokens } from '@/utils/token-tracker';
import { after } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ success: false, error: '服务器未配置 OpenAI API Key' }, { status: 400 });
    }

    // 获取用户会话
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: '用户未授权' }, { status: 401 });
    }

    const userId = session.user.id;

    const searchParams = req.nextUrl.searchParams;
    const prompt = searchParams.get('prompt');
    const model = searchParams.get('model') || 'gpt-4o';

    if (!prompt) {
      return NextResponse.json({ success: false, error: '缺少必要参数 prompt' }, { status: 400 });
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

        let inputTokens = countTokens(prompt, model);
        let outputTokens = countTokens(fullResponse, model);
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
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : '处理请求时发生错误' },
      { status: 500 }
    );
  }
} 