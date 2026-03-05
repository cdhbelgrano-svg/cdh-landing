const fs = require('fs');
try {
    const content = fs.readFileSync('lint_report.json', 'utf16le');
    if (!content) {
        console.log("No content in lint_report.json");
        process.exit(0);
    }
    const data = JSON.parse(content);
    const errors = data.filter(d => d.errorCount > 0);
    if (errors.length === 0) {
        console.log("No syntax errors found by eslint.");
    } else {
        for (const e of errors) {
            console.log(e.filePath);
            for (const m of e.messages) {
                if (m.severity === 2) {
                    console.log(`  Line ${m.line}: ${m.message}`);
                }
            }
        }
    }
} catch (err) {
    console.error("Error reading lint_report:", err);
}
