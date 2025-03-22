import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { db } from '@/db';
import { userActionLogs } from '@/db/schema';
// import { eq, and, gte } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { trackTokenCount, checkTokenLimit, getUserTokenLimit } from '@/utils/token-tracker';

export async function POST(req: NextRequest) {
  try {
    // 获取用户会话
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const user = session.user;
    
    // 获取用户token限额
    const limit = await getUserTokenLimit(user.id);
    
    // 检查是否超过限额
    const isWithinLimit = await checkTokenLimit(user.id, limit);
    if (!isWithinLimit) {
      return NextResponse.json({ 
        success: false, 
        error: '您已达到本月token使用限制，请联系管理员或等待下月重置' 
      }, { status: 403 });
    }

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

    const promptText = "请只识别并输出图片底部的日文字幕文本，不要输出其他内容。如果没有字幕，请返回空字符串。";
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: promptText
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
    
    // 从API响应中获取真实的token使用情况
    const promptTokens = data.usage?.prompt_tokens || 1000;
    const completionTokens = data.usage?.completion_tokens || 1000;
    
    console.log(`实际使用tokens: 输入=${promptTokens}, 输出=${completionTokens}, 总计=${data.usage?.total_tokens || 0}`);
    
    // 使用 after API 处理异步操作
    after(async () => {
      try {
        await Promise.all([
          trackTokenCount({
            userId: user.id,
            // 直接使用API返回的确切token数量
            inputTokens: promptTokens,
            outputTokens: completionTokens,
            model: "gpt-4o"
          }),
          db.insert(userActionLogs).values({
            userId: user.id,
            actionType: 'COMPLETE_IMAGE_OCR',
            relatedId: null,
            relatedType: null
          })
        ]);
      } catch (error) {
        console.error('记录操作失败:', error);
      }
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