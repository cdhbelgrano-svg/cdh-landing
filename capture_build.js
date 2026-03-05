const { execSync } = require('child_process');
const fs = require('fs');

try {
    const out = execSync('npx vite build', { stdio: 'pipe' });
    fs.writeFileSync('build_output.txt', out.toString(), 'utf8');
    console.log("Build passed.");
} catch (e) {
    fs.writeFileSync('build_output.txt', e.stdout.toString() + "\n" + e.stderr.toString(), 'utf8');
    console.log("Build failed. See build_output.txt");
}
