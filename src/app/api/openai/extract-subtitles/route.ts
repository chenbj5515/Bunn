import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userActionLogs } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 获取用户会话
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const user = session.user;
    
    // 如果没有订阅，检查今日使用次数
    // if (!user.has_subscription) {
    //   const today = new Date();
    //   today.setHours(0, 0, 0, 0);
      
    //   const todayUsage = await db.select()
    //     .from(userActionLogs)
    //     .where(
    //       and(
    //         eq(userActionLogs.userId, user.id),
    //         eq(userActionLogs.actionType, 'COMPLETE_IMAGE_OCR'),
    //         gte(userActionLogs.createTime, today.toISOString())
    //       )
    //     )
    //     .then(rows => rows.length);

    //   if (todayUsage >= 20) {
    //     return NextResponse.json(
    //       { success: false, error: 'Daily OCR usage limit exceeded. Please upgrade your subscription for unlimited access.' },
    //       { status: 403 }
    //     );
    //   }
    // }

    // 处理 FormData 格式的请求
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ success: false, error: '未找到图片文件' }, { status: 400 });
    }

    // 将文件转换为 base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ success: false, error: '服务器未配置 OpenAI API Key' }, { status: 400 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请只识别并输出图片底部的日文字幕文本，不要输出其他内容。如果没有字幕，请返回空字符串。"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 100
      })
    });

    const data = await response.json();
    const subtitles = data.choices?.[0]?.message?.content || '';
    
    // 记录用户操作日志
    await db.insert(userActionLogs).values({
      userId: user.id,
      actionType: 'COMPLETE_IMAGE_OCR',
      relatedId: user.id,
      relatedType: 'word_card'
    });

    return NextResponse.json({ success: true, subtitles });
  } catch (err: unknown) {
    console.error('OCR处理错误:', err instanceof Error ? err.message : '未知错误');
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : '处理请求时发生错误' },
      { status: 500 }
    );
  }
} 