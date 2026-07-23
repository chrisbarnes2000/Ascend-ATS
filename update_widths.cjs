const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const appFile = path.join(__dirname, 'src', 'App.tsx');

const replaceInFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Find standard main panel wrappers
  // They typically look like: `className="... max-w-[34567]xl mx-auto ..."`
  content = content.replace(/max-w-[34567]xl mx-auto/g, 'max-w-[75vw] mx-auto');
  
  fs.writeFileSync(filePath, content);
};

// Process App.tsx
replaceInFile(appFile);

// Process pages
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
for (const file of files) {
  replaceInFile(path.join(pagesDir, file));
}
console.log('Done!');
