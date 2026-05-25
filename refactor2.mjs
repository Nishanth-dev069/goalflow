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

for (const file of project.getSourceFiles()) {
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

  const functions = file.getFunctions().filter(f => f.isExported() && f.isAsync());
  
  for (const func of functions) {
    const name = func.getName();
    if (['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(name)) {
      const body = func.getBody();
      if (body && body.getKind() === SyntaxKind.Block) {
        const statements = body.getStatements();
        
        // Find the index where the business logic starts (after checking currentUser)
        let logicStartIndex = -1;
        for (let i = 0; i < statements.length; i++) {
          const stmt = statements[i].getText();
          if (stmt.includes('if (!currentUser') || stmt.includes('if (!currentUser.is_active')) {
            logicStartIndex = i + 1;
            break;
          }
        }
        
        if (logicStartIndex === -1) {
            // fallback: find first statement that isn't auth related
            for (let i = 0; i < statements.length; i++) {
                const stmt = statements[i].getText();
                if (!stmt.includes('createClient') && !stmt.includes('getSession') && !stmt.includes('session') && !stmt.includes('currentUser') && !stmt.includes('from("users")')) {
                    logicStartIndex = i;
                    break;
                }
            }
        }

        if (logicStartIndex !== -1 && logicStartIndex < statements.length) {
            const logicStatementsText = statements.slice(logicStartIndex).map(s => s.getText()).join('\\n');
            
            // Only wrap in try-catch if not already
            const newBodyText = `
  try {
${standardAuthCode}
    ${logicStatementsText}
  } catch (err) {
    return serverError(err)
  }
`;
            func.setBodyText(newBodyText);
            modified = true;
        }
      }
    }
  }

  if (modified) {
    file.saveSync();
    console.log("Refactored", file.getFilePath());
  }
}
