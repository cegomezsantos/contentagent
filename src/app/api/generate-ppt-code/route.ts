import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { 
      tema_sesion, 
      contenido_investigacion, 
      numero_sesion, 
      nombre_curso,
      codigo_curso 
    } = await request.json();

    if (!tema_sesion || !contenido_investigacion) {
      return NextResponse.json(
        { error: 'Tema de sesión y contenido de investigación son requeridos' },
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

    const prompt = `Eres un experto en diseño de presentaciones educativas. Tu tarea es crear una estructura JSON detallada para una presentación PowerPoint basada en el contenido de investigación proporcionado.

**INFORMACIÓN DE LA SESIÓN:**
- Curso: ${nombre_curso}
- Código: ${codigo_curso}
- Sesión: ${numero_sesion}
- Tema: ${tema_sesion}

**CONTENIDO DE LA INVESTIGACIÓN:**
${contenido_investigacion}

**INSTRUCCIONES ESPECÍFICAS:**
1. Analiza el contenido de investigación y divídelo en slides lógicos
2. Crea una presentación de 12-18 diapositivas aproximadamente
3. Usa ÚNICAMENTE los 8 tipos de slides permitidos
4. Incluye sugerencias específicas de imágenes/esquemas
5. Distribuye el contenido de manera didáctica y equilibrada

**TIPOS DE SLIDES PERMITIDOS:**
1. **portada** - Slide de título principal
2. **indice** - Tabla de contenidos/agenda
3. **subtemas** - Lista de subtemas o puntos clave
4. **texto_imagen** - Texto principal con sugerencia de imagen
5. **dos_columnas** - Contenido dividido en dos columnas
6. **solo_imagen** - Slide principalmente visual con esquemas/diagramas
7. **solo_texto** - Contenido puramente textual
8. **conclusion** - Slide de cierre y conclusiones

**FORMATO DE RESPUESTA:**
Responde ÚNICAMENTE con un JSON válido siguiendo esta estructura exacta:

\`\`\`json
{
  "meta": {
    "curso": "${nombre_curso}",
    "codigo": "${codigo_curso}",
    "sesion": ${numero_sesion},
    "tema": "${tema_sesion}",
    "total_slides": 0
  },
  "slides": [
    {
      "numero": 1,
      "tipo": "portada",
      "titulo": "Título principal",
      "contenido": {
        "titulo_principal": "Título",
        "subtitulo": "Subtítulo",
        "curso": "${nombre_curso}",
        "sesion": "Sesión ${numero_sesion}",
        "codigo": "${codigo_curso}"
      }
    },
    {
      "numero": 2,
      "tipo": "indice",
      "titulo": "Agenda",
      "contenido": {
        "items": [
          "Punto 1",
          "Punto 2", 
          "Punto 3"
        ]
      }
    },
    {
      "numero": 3,
      "tipo": "texto_imagen",
      "titulo": "Título del slide",
      "contenido": {
        "texto": "Contenido textual principal",
        "sugerencia_imagen": "Descripción específica de la imagen o esquema sugerido"
      }
    }
  ]
}
\`\`\`

**REGLAS CRÍTICAS:**
1. JSON válido y bien formateado
2. Solo usar los 8 tipos de slides permitidos
3. Contenido educativo y bien estructurado
4. Sugerencias específicas de imágenes/esquemas
5. Texto claro y conciso en cada slide
6. Secuencia lógica del contenido

Genera un JSON completo y bien estructurado basado en la investigación proporcionada.`;

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
    
    // Limpiar el JSON si viene con markdown
    const jsonLimpio = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Validar que sea JSON válido
    try {
      const jsonParsed = JSON.parse(jsonLimpio);
      return NextResponse.json({ json_estructura: jsonLimpio, json_parsed: jsonParsed });
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return NextResponse.json({ json_estructura: jsonLimpio, error: 'JSON inválido generado' });
    }
  } catch (error: unknown) {
    console.error('Error en DeepSeek API para PPT:', error);
    
    // Manejar errores específicos de la API
    const apiError = error as { status?: number; message?: string };
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
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 