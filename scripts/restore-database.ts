import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function restoreDatabase(backupDate: string) {
  const backupDir = path.join(process.cwd(), 'backups', backupDate);
  
  if (!fs.existsSync(backupDir)) {
    console.error(`❌ No existe backup para la fecha: ${backupDate}`);
    process.exit(1);
  }

  console.log(`🔄 Restaurando backup: ${backupDate}`);
  console.log('⚠️  ADVERTENCIA: Esto sobrescribirá datos existentes');
  
  const tables = [
    'users_profiles',
    'properties',
    'tickets', 
    'providers',
    'ticket_timeline'
  ];

  for (const table of tables) {
    const filePath = path.join(backupDir, `${table}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  ⏭️  Saltando ${table} (no encontrado)`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`  ⏳ Restaurando ${table}: ${data.length} registros`);

    // Nota: Esto requiere permisos de admin y cuidado con constraints
    // Usar batch upsert para mejor rendimiento
    const { error } = await supabase
      .from(table)
      .upsert(data);
      
    if (error) {
      console.error(`  ❌ Error restaurando ${table}:`, error);
    } else {
      console.log(`  ✅ ${table} restaurado`);
    }
  }

  console.log(`✅ Restauración completada`);
}

const backupDate = process.argv[2];
if (!backupDate) {
  console.error('❌ Uso: npm run backup:restore YYYY-MM-DD');
  process.exit(1);
}

restoreDatabase(backupDate);
