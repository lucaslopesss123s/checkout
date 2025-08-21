import { NextResponse } from 'next/server';
import { migrateAllData } from '@/lib/migrate-firebase-to-postgres';

export async function POST() {
  try {
    // Iniciar a migração de dados
    await migrateAllData();
    
    return NextResponse.json({ success: true, message: 'Migração concluída com sucesso' });
  } catch (error) {
    console.error('Erro durante a migração:', error);
    return NextResponse.json(
      { success: false, error: 'Erro durante a migração de dados' },
      { status: 500 }
    );
  }
}