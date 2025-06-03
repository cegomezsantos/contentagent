import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar si la API Key está configurada
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    return NextResponse.json({
      apiKeyConfigured: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'No configurada',
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error verificando configuración',
      details: error
    }, { status: 500 });
  }
} 