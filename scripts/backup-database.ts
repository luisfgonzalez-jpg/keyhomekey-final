import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backupDatabase() {
  const timestamp = new Date().toISOString().split('T')[0];
  const backupDir = path.join(process.cwd(), 'backups', timestamp);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`📦 Iniciando backup: ${timestamp}`);

  try {
    // Backup de tablas principales
    const tables = [
      'users_profiles',
      'properties', 
      'tickets',
      'providers',
      'ticket_timeline'
    ];

    for (const table of tables) {
      console.log(`  ⏳ Respaldando tabla: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.error(`  ❌ Error en ${table}:`, error);
        continue;
      }

      const filePath = path.join(backupDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`  ✅ ${table}: ${data?.length || 0} registros`);
    }

    // Crear archivo de metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      tables: tables.length,
      success: true
    };
    
    fs.writeFileSync(
      path.join(backupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log(`✅ Backup completado: ${backupDir}`);
    
    // Limpiar backups antiguos (más de 30 días)
    cleanOldBackups();
    
  } catch (error) {
    console.error('❌ Error durante backup:', error);
    process.exit(1);
  }
}

function cleanOldBackups() {
  const backupsDir = path.join(process.cwd(), 'backups');
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  if (!fs.existsSync(backupsDir)) return;
  
  const folders = fs.readdirSync(backupsDir);
  
  folders.forEach(folder => {
    const folderPath = path.join(backupsDir, folder);
    const stats = fs.statSync(folderPath);
    
    if (stats.isDirectory() && stats.mtimeMs < thirtyDaysAgo) {
      fs.rmSync(folderPath, { recursive: true });
      console.log(`🗑️  Eliminado backup antiguo: ${folder}`);
    }
  });
}

backupDatabase();
