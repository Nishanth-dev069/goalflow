const fs = require('fs')
const path = require('path')

// Create icons dir
fs.mkdirSync('./public/icons', { recursive: true })

// SVG source
const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0a0a0a"/>
  <rect x="${size*0.1}" y="${size*0.1}" width="${size*0.8}" height="${size*0.8}" rx="${size*0.18}" fill="#6366f1"/>
  <circle cx="${size*0.5}" cy="${size*0.44}" r="${size*0.14}" fill="none" stroke="white" stroke-width="${size*0.055}"/>
  <line x1="${size*0.5}" y1="${size*0.30}" x2="${size*0.5}" y2="${size*0.21}" stroke="white" stroke-width="${size*0.055}" stroke-linecap="round"/>
  <line x1="${size*0.60}" y1="${size*0.60}" x2="${size*0.72}" y2="${size*0.72}" stroke="white" stroke-width="${size*0.055}" stroke-linecap="round"/>
  <circle cx="${size*0.5}" cy="${size*0.44}" r="${size*0.035}" fill="white"/>
</svg>`

// Write SVG icons
fs.writeFileSync('./public/icons/icon-192.svg', svg(192))
fs.writeFileSync('./public/icons/icon-512.svg', svg(512))

// Convert to PNG using sharp if available, else use SVG directly
try {
  const sharp = require('sharp')
  sharp(Buffer.from(svg(192))).png().toFile('./public/icons/icon-192.png', () => console.log('192 done'))
  sharp(Buffer.from(svg(512))).png().toFile('./public/icons/icon-512.png', () => console.log('512 done'))
} catch {
  console.log('sharp not available — copying SVG as PNG reference')
  fs.copyFileSync('./public/icons/icon-192.svg', './public/icons/icon-192.png')
  fs.copyFileSync('./public/icons/icon-512.svg', './public/icons/icon-512.png')
}
