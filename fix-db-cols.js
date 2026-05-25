const fs = require('fs');
const path = require('path');

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

  // Fix goals foreign key
  content = content.replace(/goals_creator_id_fkey/g, 'goals_created_by_fkey');
  
  // Fix tasks foreign key
  content = content.replace(/tasks_creator_id_fkey/g, 'tasks_assigned_by_fkey');

  // Fix tasks assignee_id which should probably be assigned_to in the DB?
  // Wait, DB has assigned_to. But the API might be using assignee_id. Let's leave assignee_id alone for now unless it causes errors, because Supabase might return it as assignee_id if it's aliased.

  // In goals routes, replace creator_id with created_by
  if (file.includes('goals')) {
    content = content.replace(/creator_id\.eq/g, 'created_by.eq');
    content = content.replace(/goal\.creator_id/g, 'goal.created_by');
  }

  // In tasks routes, replace creator_id with assigned_by
  if (file.includes('tasks')) {
    content = content.replace(/creator_id\.eq/g, 'assigned_by.eq');
    content = content.replace(/creator_id:/g, 'assigned_by:');
  }

  // In dashboard route (which queries both)
  if (file.includes('dashboard')) {
    // It's manually aliasing them as 'creator' or 'assigner' via foreign key mapping, 
    // the only direct field usage might be in JS logic.
    content = content.replace(/goal\.creator_id/g, 'goal.created_by');
    content = content.replace(/task\.creator_id/g, 'task.assigned_by');
  }

  // In [id]/page.tsx
  if (file.includes('goals/[id]/page.tsx')) {
    content = content.replace(/goal\.creator_id/g, 'goal.created_by');
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}
