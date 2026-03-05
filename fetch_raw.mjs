import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const CLIENT_ID = process.env.VITE_FUDO_CLIENT_ID;
const CLIENT_SECRET = process.env.VITE_FUDO_CLIENT_SECRET;
const BASE_URL = 'https://integrations.fu.do/fudo';

async function fetchAll() {
    try {
        console.log("Obteniendo token...");
        const authRes = await fetch(`${BASE_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET })
        });
        const authData = await authRes.json();
        const token = authData.token;

        console.log("Obteniendo productos...");
        const prodRes = await fetch(`${BASE_URL}/products`, {
            method: 'GET',
            headers: {
                'Fudo-External-App-Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const prodData = await prodRes.json();

        const outputPath = "C:\\Users\\tatoe\\.gemini\\antigravity\\brain\\cbf7c232-ddc3-4abd-9238-a449067e88a0\\fudo_all_products.json";
        fs.writeFileSync(outputPath, JSON.stringify(prodData, null, 2));
        console.log(`Guardado exitosamente en ${outputPath}`);
    } catch (e) {
        console.error(e);
    }
}

fetchAll();
