import { NextRequest, NextResponse } from 'next/server';

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
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key de Perplexity no configurada en el servidor' },
        { status: 500 }
      );
    }

    // Realizar la llamada a Perplexity
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error de Perplexity API:', response.status, errorData);
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'API Key inválida. Verifica la configuración de Perplexity.' },
          { status: 401 }
        );
      }
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Límite de rate excedido. Intenta nuevamente en unos minutos.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Error de Perplexity API: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.choices[0]?.message?.content || '';

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Error en Perplexity API:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 