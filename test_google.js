fetch('https://places.googleapis.com/v1/places/ChIJw6TZZxJ7GpYR_nKUxBKBvE0?languageCode=es', {
    headers: {
        'X-Goog-Api-Key': 'AIzaSyDGuUmVLjJC7i2W3BsEjoi31wz7_fkDJfc',
        'X-Goog-FieldMask': 'reviews,rating,userRatingCount'
    }
})
    .then(r => r.json())
    .then(d => console.log(JSON.stringify(d, null, 2)))
    .catch(console.error);
