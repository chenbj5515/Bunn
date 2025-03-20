import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ success: false, error: '未配置 OpenAI API 密钥' }, { status: 500 });
    }

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

    const { prompt, model = 'gpt-4' } = body;

    if (!prompt) {
      return NextResponse.json({ success: false, error: '缺少必要的 prompt 参数' }, { status: 400 });
    }

    // 使用 ai-sdk 的 openaiClient 替代直接 fetch
    const result = await generateText({
      model: openai(model),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
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