const fs = require('fs');
const apiKey = 'AIzaSyDGuUmVLjJC7i2W3BsEjoi31wz7_fkDJfc';
const placeId = 'ChIJw6TZZxJ7GpYR_nKUxBKBvE0';

async function run() {
    const result = { newApi: null, oldApi: null };

    // Test New API
    try {
        const res1 = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=es`, {
            headers: {
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'reviews,rating,userRatingCount'
            }
        });
        result.newApi = await res1.json();
    } catch (e) { result.newApi = e.message; }

    // Test Old API
    try {
        const res2 = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}&language=es`);
        result.oldApi = await res2.json();
    } catch (e) { result.oldApi = e.message; }

    fs.writeFileSync('output.json', JSON.stringify(result, null, 2), 'utf8');
}

run();
