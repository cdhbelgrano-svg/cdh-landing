import { execSync } from 'child_process';
import fs from 'fs';

try {
    const result = execSync('npx eslint src', { encoding: 'utf-8' });
    console.log("No lint errors.");
} catch (e) {
    if (e.stdout) {
        fs.writeFileSync('lint_errors.txt', e.stdout.toString(), 'utf-8');
        console.log("Lint errors written to lint_errors.txt");
    } else {
        console.error("Unknown error running eslint");
    }
}
