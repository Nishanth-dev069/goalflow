import { Project, SyntaxKind } from "ts-morph";

const project = new Project();
project.addSourceFilesAtPaths("app/api/**/route.ts");

const standardAuthCode = `
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return unauthorized()
    }

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, role, department_id, is_active')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser || !currentUser.is_active) {
      return unauthorized()
    }
`;

const files = project.getSourceFiles();

for (const file of files) {
  if (file.getFilePath().includes('/goals/route.ts') || file.getFilePath().includes('/tasks/route.ts')) {
    continue;
  }

  let modified = false;

  const importDecs = file.getImportDeclarations();
  const errorsImport = importDecs.find(i => i.getModuleSpecifierValue() === '@/lib/utils/errors');
  
  if (!errorsImport) {
    file.addImportDeclaration({
      moduleSpecifier: '@/lib/utils/errors',
      namedImports: ['unauthorized', 'forbidden', 'serverError', 'apiError']
    });
    modified = true;
  } else {
    const named = errorsImport.getNamedImports().map(n => n.getName());
    const toAdd = ['unauthorized', 'forbidden', 'serverError', 'apiError'].filter(n => !named.includes(n));
    if (toAdd.length > 0) {
      errorsImport.addNamedImports(toAdd);
      modified = true;
    }
  }

  const functions = file.getFunctions().filter(f => f.isExported());
  
  for (const func of functions) {
    const name = func.getName();
    if (['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(name)) {
      const body = func.getBody();
      if (body && body.getKind() === SyntaxKind.Block) {
        const statements = body.getStatements();
        const text = statements.map(s => s.getText()).join('\n');
        
        let logicStartText = text;
        
        // Match standard checks
        const regex1 = /if\s*\(!currentUser[^}]+\}/;
        const match = text.match(regex1);
        
        if (match) {
          const splitIndex = text.indexOf(match[0]) + match[0].length;
          logicStartText = text.substring(splitIndex).trim();
        } else {
          // Sometimes it might not have currentUser check
          const match2 = text.match(/(const { searchParams }|const json =|const body =|try {)/);
          if (match2) {
            const splitIndex = text.indexOf(match2[0]);
            logicStartText = text.substring(splitIndex).trim();
          }
        }
        
        // If it starts with try {, extract inside it to avoid double nesting
        if (logicStartText.startsWith('try {')) {
           const innerMatch = logicStartText.match(/^try\s*\{([\s\S]*)\}\s*catch/);
           if (innerMatch) {
               logicStartText = innerMatch[1].trim();
           }
        }
        
        let newBodyText = `
  try {
${standardAuthCode}
    ${logicStartText}
  } catch (err) {
    return serverError(err)
  }
`;

        func.setBodyText(newBodyText);
        modified = true;
      }
    }
  }

  if (modified) {
    file.saveSync();
    console.log("Refactored", file.getFilePath());
  }
}
