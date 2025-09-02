import { NextRequest, NextResponse } from 'next/server'

// Função para adicionar headers CORS
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// Função OPTIONS para requisições preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return addCorsHeaders(response)
}

export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.json({
      status: 'ok',
      message: 'API está funcionando',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    })
    return addCorsHeaders(response)
  } catch (error) {
    console.error('Erro no health check:', error)
    const response = NextResponse.json(
      { 
        status: 'error',
        message: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}