import fs from 'fs';

const CLIENT_ID = 'MDAwMDM6MjgxNzcx';
const CLIENT_SECRET = 'IHF7LdjSSzl9AJG6Ry9CAbs2';
const BASE_URL = 'https://integrations.fu.do/fudo';

async function fetchAll() {
    try {
        const authRes = await fetch(`${BASE_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET })
        });
        const token = (await authRes.json()).token;

        const prodRes = await fetch(`${BASE_URL}/products`, {
            method: 'GET',
            headers: { 'Fudo-External-App-Authorization': `Bearer ${token}` }
        });
        const products = (await prodRes.json()).products;

        const mGroupsRes = await fetch(`${BASE_URL}/modifier-groups`, {
            method: 'GET',
            headers: { 'Fudo-External-App-Authorization': `Bearer ${token}` }
        });
        const modifierGroups = (await mGroupsRes.json()).modifierGroups;

        const modRes = await fetch(`${BASE_URL}/modifiers`, {
            method: 'GET',
            headers: { 'Fudo-External-App-Authorization': `Bearer ${token}` }
        });
        const modifiers = (await modRes.json()).modifiers;

        const linkedProduct = products.find(p => p.modifierGroupIds && p.modifierGroupIds.length > 0) || products.find(p => p.modifierGroupElements && p.modifierGroupElements.length > 0);

        console.log("Product Link:", JSON.stringify(linkedProduct, null, 2));
        console.log("Mod Group:", JSON.stringify(modifierGroups[0], null, 2));
        console.log("Modifier:", JSON.stringify(modifiers[0], null, 2));

    } catch (e) {
        console.error(e);
    }
}

fetchAll();
