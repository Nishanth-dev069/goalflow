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

      // Match multi-line destructuring:
      // const {
      //   data: { session },
      // } = await supabase.auth.getUser()
      const regex1 = /const\s*\{\s*data\s*:\s*\{\s*session\s*\}\s*,?\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\)/g
      if (regex1.test(content)) {
        content = content.replace(regex1, 'const { data: { user: sessionUser } } = await supabase.auth.getUser()\n  const session = sessionUser ? { user: sessionUser } : null')
        modified = true
      }

      // Match multi-line with error:
      const regex2 = /const\s*\{\s*data\s*:\s*\{\s*session\s*\}\s*,\s*error[a-zA-Z0-9_:\s]*\}\s*=\s*await\s+supabase\.auth\.getUser\(\)/g
      if (regex2.test(content)) {
        content = content.replace(regex2, 'const { data: { user: sessionUser }, error } = await supabase.auth.getUser()\n  const session = sessionUser ? { user: sessionUser } : null')
        modified = true
      }

      // Also match any left-over `.then(({ data: { session } })`
      const regex3 = /\.getUser\(\)\.then\(\(\{\s*data\s*:\s*\{\s*session\s*\}\s*\}\)\s*=>/g
      if (regex3.test(content)) {
        content = content.replace(regex3, '.getUser().then(({ data: { user } }) => { const session = user ? { user } : null;')
        modified = true
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8')
        console.log(`Fixed multi-line in ${fullPath}`)
      }
    }
  }
}

processDirectory(searchDir)
console.log('Done fixing multiline')
