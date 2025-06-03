import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt es requerido' },
        { status: 400 }
      );
    }

    // Obtener API Key desde variables de entorno
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key de DeepSeek no configurada en el servidor' },
        { status: 500 }
      );
    }

    // Configurar cliente de OpenAI para DeepSeek
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey,
    });

    // Realizar la llamada a DeepSeek
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const result = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Error en DeepSeek API:', error);
    
    // Manejar errores específicos de la API
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'API Key inválida. Verifica la configuración de DeepSeek.' },
        { status: 401 }
      );
    }
    
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Límite de rate excedido. Intenta nuevamente en unos minutos.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 