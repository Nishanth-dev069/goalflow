const fs = require('fs');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('app').concat(walk('components')).concat(walk('types')).concat(walk('lib'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Be careful not to replace 'GoalType' or similar. We specifically want the property 'goal_type'.
  content = content.replace(/goal_type/g, 'type');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}
