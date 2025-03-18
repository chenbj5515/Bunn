import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function GET(req: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ success: false, error: '服务器未配置 OpenAI API Key' }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    const prompt = searchParams.get('prompt');
    const model = searchParams.get('model') || 'gpt-4';

    if (!prompt) {
      return NextResponse.json({ success: false, error: '缺少必要参数 prompt' }, { status: 400 });
    }

    // 使用 Vercel AI SDK 创建流式响应
    const result = streamText({
      model: openai(model),
      messages: [{ role: 'user', content: prompt }],
    });

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        for await (const delta of result.textStream) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ delta })}\n\n`));
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
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
  } catch (err: any) {
    console.error('流式响应错误:', err);
    return NextResponse.json(
      { success: false, error: err?.message || '处理请求时发生错误' },
      { status: 500 }
    );
  }
} 