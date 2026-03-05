import fs from 'fs';

const CLIENT_ID = 'MDAwMDM6MjgxNzcx';
const CLIENT_SECRET = 'IHF7LdjSSzl9AJG6Ry9CAbs2';
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

        console.log("Obteniendo categorías...");
        const catRes = await fetch(`${BASE_URL}/product-categories`, {
            method: 'GET',
            headers: { 'Fudo-External-App-Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const catData = await catRes.json();

        console.log("Obteniendo productos...");
        const prodRes = await fetch(`${BASE_URL}/products`, {
            method: 'GET',
            headers: { 'Fudo-External-App-Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const prodData = await prodRes.json();

        const outputPath = "C:\\Users\\tatoe\\.gemini\\antigravity\\brain\\cbf7c232-ddc3-4abd-9238-a449067e88a0\\fudo_all_data.json";
        fs.writeFileSync(outputPath, JSON.stringify({ categories: catData.productCategories, products: prodData.products }, null, 2));
        console.log(`Guardado exitosamente en ${outputPath}`);
    } catch (e) {
        console.error(e);
    }
}

fetchAll();
