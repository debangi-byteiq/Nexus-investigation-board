// Simple bundler: transpile TSX -> JS, inline CSS, wrap in HTML

const fs = require('fs');
const path = require('path');

// Read all source files
const files = {};
function readDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) readDir(fp);
    else files[fp] = fs.readFileSync(fp, 'utf8');
  });
}
readDir('/home/claude/nexus-board/src');

console.log('Files found:', Object.keys(files).map(f => f.replace('/home/claude/nexus-board/src/','')));
