// Deterministic source formatting without an additional dependency.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (/\.tsx?$/.test(file)) {
      const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      if (source.parseDiagnostics.length) throw Error(`Syntax error in ${file}`);
      fs.writeFileSync(file, ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printFile(source));
    }
  }
}
visit('src');
visit('modules');
visit('tests');
