import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const searchDir = path.join(__dirname, 'app')

function processDirectory(directory) {
  const files = fs.readdirSync(directory)
  for (const file of files) {
    const fullPath = path.join(directory, file)
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath)
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8')
      let modified = false

      // Pattern 1: const { data: { session } } = await supabase.auth.getSession()
      // Replace with: const { data: { user } } = await supabase.auth.getUser()
      if (content.includes('supabase.auth.getSession()')) {
        content = content.replace(
          /const\s+{\s*data:\s*{\s*session\s*}\s*}\s*=\s*await\s+supabase\.auth\.getSession\(\)/g,
          'const { data: { user: sessionUser } } = await supabase.auth.getUser()\n  const session = sessionUser ? { user: sessionUser } : null'
        )
        content = content.replace(
          /const\s+{\s*data:\s*{\s*session\s*},\s*error:\s*sessionError\s*}\s*=\s*await\s+supabase\.auth\.getSession\(\)/g,
          'const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()\n  const session = sessionUser ? { user: sessionUser } : null'
        )
        content = content.replace(
          /supabase\.auth\.getSession\(\)/g,
          'supabase.auth.getUser()' // Fallback for other uses
        )
        modified = true
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8')
        console.log(`Updated ${fullPath}`)
      }
    }
  }
}

processDirectory(searchDir)
console.log('Done replacing getSession with getUser')
