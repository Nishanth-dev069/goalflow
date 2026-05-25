import fs from 'fs';
import path from 'path';

function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = dir + '/' + file;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else {
      files.push(name);
    }
  }
  return files;
}

const files = getFiles('app/api').filter(f => f.endsWith('route.ts'));

for (const file of files) {
  if (file.includes('goals/route.ts') || file.includes('tasks/route.ts')) continue;
  
  let content = fs.readFileSync(file, 'utf-8');
  
  content = content.replace(/\\nconst/g, '\nconst');
  content = content.replace(/\\nlet/g, '\nlet');
  content = content.replace(/\\nif/g, '\nif');
  content = content.replace(/\\nquery/g, '\nquery');
  content = content.replace(/\\nreturn/g, '\nreturn');
  content = content.replace(/\\n\}/g, '\n}');
  content = content.replace(/\\ntry/g, '\ntry');
  content = content.replace(/\\nconsole/g, '\nconsole');
  content = content.replace(/\\nawait/g, '\nawait');
  content = content.replace(/\\nexport/g, '\nexport');
  content = content.replace(/\\nimport/g, '\nimport');
  content = content.replace(/\\n\/\//g, '\n//');
  
  fs.writeFileSync(file, content);
  console.log("Fixed", file);
}
