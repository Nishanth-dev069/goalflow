import fs from 'fs';
import glob from 'glob';

const files = glob.sync('app/api/**/route.ts');

for (const file of files) {
  if (file.includes('goals/route.ts') || file.includes('tasks/route.ts')) continue;
  
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace the literal \n injected by the script
  // It looks like \nconst, \nlet, \nif, \nquery, \nreturn, \n}
  content = content.replace(/\\n(const |let |if |query|return |\}|try |console|await)/g, '\n$1');
  
  // Wait, there's also ``, { count: 'exact' })\nif`
  content = content.replace(/\\nif/g, '\nif');
  content = content.replace(/\\nconst/g, '\nconst');
  content = content.replace(/\\nlet/g, '\nlet');
  content = content.replace(/\\nquery/g, '\nquery');
  content = content.replace(/\\nreturn/g, '\nreturn');
  
  fs.writeFileSync(file, content);
  console.log("Fixed", file);
}
