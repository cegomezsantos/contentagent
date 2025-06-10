import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Configurar timeout máximo para Netlify
export const config = {
  maxDuration: 30, // Netlify Pro permite hasta 30 segundos
};

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
      timeout: 25000, // 25 segundos timeout
    });

    // Realizar la llamada a DeepSeek con timeout personalizado
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 3000, // Reducir tokens para respuesta más rápida
        stream: false,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: La API tardó demasiado en responder')), 25000)
      ),
    ]) as any;

    const result = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error('Error en DeepSeek API:', error);
    
    const apiError = error as { status?: number; message?: string };
    
    // Manejar timeout específicamente
    if (apiError.message?.includes('Timeout')) {
      return NextResponse.json(
        { error: 'La análisis tardó demasiado. Por favor intenta nuevamente con un texto más corto.' },
        { status: 504 }
      );
    }
    
    // Manejar errores específicos de la API
    if (apiError.status === 401) {
      return NextResponse.json(
        { error: 'API Key inválida. Verifica la configuración de DeepSeek.' },
        { status: 401 }
      );
    }
    
    if (apiError.status === 429) {
      return NextResponse.json(
        { error: 'Límite de rate excedido. Intenta nuevamente en unos minutos.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `Error del servidor: ${apiError.message || 'Error desconocido'}` },
      { status: 500 }
    );
  }
} 