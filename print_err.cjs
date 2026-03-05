const fs = require('fs');
if (fs.existsSync('vite_err.txt')) console.log(fs.readFileSync('vite_err.txt', 'utf8'));
if (fs.existsSync('vite_out.txt')) console.log(fs.readFileSync('vite_out.txt', 'utf8'));
