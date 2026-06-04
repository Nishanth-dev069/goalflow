const fs = require('fs');
const path = require('path');
const swPath = path.join(__dirname, '../public/sw.js');
let content = fs.readFileSync(swPath, 'utf8');
const newVersion = `goalflow-v${Date.now()}`;
content = content.replace(/const CACHE_VERSION = ['"`][^'"`]+['"`]/, 
                          `const CACHE_VERSION = '${newVersion}'`);
fs.writeFileSync(swPath, content);
console.log('SW cache version bumped to:', newVersion);
