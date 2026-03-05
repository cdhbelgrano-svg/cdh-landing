import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/tatoe/.gemini/antigravity/brain/cbf7c232-ddc3-4abd-9238-a449067e88a0/fudo_all_data.json', 'utf8'));

console.log("Total products in JSON:", data.products.length);

const prod109 = data.products.find(p => p.id === 109);
console.log("Product 109:", prod109);

// Find what product group options correspond to the "Para tus papas" group
const targetProduct = data.products.find(p => p.productGroups && p.productGroups.some(g => g.name === 'Para tus papas'));
if (targetProduct) {
    const group = targetProduct.productGroups.find(g => g.name === 'Para tus papas');
    console.log("Para tus papas group:", JSON.stringify(group, null, 2));

    // Check if the products referenced exist in the main products array
    for (let option of group.productGroupProducts) {
        const p = data.products.find(x => x.id === option.productId);
        if (p) {
            console.log(`Option ${option.productId} mapped to: ${p.name}`);
        } else {
            console.log(`Option ${option.productId} NOT FOUND IN PRODUCT LIST!`);
        }
    }
}
