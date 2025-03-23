import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { db } from '@/db';
import { userActionLogs } from '@/db/schema';
// import { eq, and, gte } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { trackTokenCount, checkTokenLimit, getUserTokenLimit } from '@/utils/token-tracker';

// 错误码定义
const ERROR_CODES = {
  // 认证相关错误 (1000-1999)
  UNAUTHORIZED: 1001,
  
  // 输入相关错误 (2000-2999)
  INVALID_REQUEST_BODY: 2001,
  MISSING_PARAMETERS: 2002,
  MISSING_IMAGE: 2003,
  
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
    // 获取用户会话
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: '未授权',
        errorCode: ERROR_CODES.UNAUTHORIZED
      }, { status: 401 });
    }

    const user = session.user;
    
    // 获取用户token限额
    const limit = await getUserTokenLimit(user.id);
    
    // 检查是否超过限额
    const isWithinLimit = await checkTokenLimit(user.id, limit);
    if (!isWithinLimit) {
      return NextResponse.json({ 
        success: false, 
        error: '您已达到本月token使用限制，请联系管理员或等待下月重置',
        errorCode: ERROR_CODES.TOKEN_LIMIT_EXCEEDED
      }, { status: 403 });
    }

    // 处理 FormData 格式的请求
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ 
        success: false, 
        error: '未找到图片文件',
        errorCode: ERROR_CODES.MISSING_IMAGE
      }, { status: 400 });
    }

    // 将文件转换为 base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ 
        success: false, 
        error: '服务器未配置 OpenAI API Key',
        errorCode: ERROR_CODES.OPENAI_API_KEY_MISSING
      }, { status: 400 });
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
    
    // 检查API是否返回错误
    if (data.error) {
      console.error('OpenAI API返回错误:', data.error);
      return NextResponse.json({
        success: false,
        error: `OpenAI API错误: ${data.error.message || '未知错误'}`,
        errorCode: ERROR_CODES.OPENAI_API_ERROR
      }, { status: 500 });
    }
    
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