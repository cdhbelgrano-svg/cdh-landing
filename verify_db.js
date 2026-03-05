import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
    console.log("🔍 Iniciando Verificación de Base de Datos...");
    console.log("======================================\n");

    let allGood = true;

    // Lista de tablas a verificar
    const tables = [
        'orders',
        'delivery_settings',
        'promos_codes',
        'promos_auto',
        'promos_banners',
        'vip_users',
        'admin_users'
    ];

    console.log("1️⃣ Verificando Tablas:");
    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                console.error(`❌ Tabla '${table}': ERROR - ${error.message}`);
                allGood = false;
            } else {
                console.log(`✅ Tabla '${table}': OK`);
            }
        } catch (err) {
            console.error(`❌ Tabla '${table}': ERROR INESPERADO - ${err.message}`);
            allGood = false;
        }
    }

    console.log("\n2️⃣ Verificando Storage (Buckets):");
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error(`❌ Storage: ERROR leyendo buckets - ${error.message}`);
            allGood = false;
        } else {
            const bucketNames = buckets.map(b => b.name);
            if (bucketNames.includes('banners')) {
                console.log(`✅ Bucket 'banners': OK (Encontrado)`);

                // Verificar permisos de subida intentando subir un archivo de texto vacío
                const { data: testUpload, error: uploadError } = await supabase.storage
                    .from('banners')
                    .upload('test_conn.txt', new Blob(['test']), { upsert: true });

                if (uploadError && !uploadError.message.includes('permission')) {
                    console.error(`❌ Permisos de subida: ERROR INESPERADO - ${uploadError.message}`);
                } else if (uploadError && uploadError.message.includes('permission')) {
                    console.error(`❌ Permisos de subida (Insert/Update): FALLARON (Revisa las políticas GOR)`);
                    allGood = false;
                } else {
                    console.log(`✅ Permisos de subida: OK (Puedes subir archivos)`);
                    // Limpiar archivo de prueba
                    await supabase.storage.from('banners').remove(['test_conn.txt']);
                }
            } else {
                console.error(`❌ Bucket 'banners': FALTA (No se creó el bucket)`);
                allGood = false;
            }
        }
    } catch (err) {
        console.error(`❌ Storage: ERROR INESPERADO - ${err.message}`);
        allGood = false;
    }

    console.log("\n======================================");
    if (allGood) {
        console.log("🎉 RESULTADO: ¡TODO ESTÁ EN ORDEN! Tu base de datos está lista.");
    } else {
        console.log("⚠️ RESULTADO: HAY ERRORES. Revisa los mensajes con ❌ arriba.");
    }
}

runTests();
