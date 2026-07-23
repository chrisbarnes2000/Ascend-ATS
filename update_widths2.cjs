const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const appFile = path.join(__dirname, 'src', 'App.tsx');

const replaceInFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  
  content = content.replace(/max-w-\[75vw\] mx-auto/g, 'w-full md:w-[75vw] max-w-none mx-auto');
  
  fs.writeFileSync(filePath, content);
};

replaceInFile(appFile);

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
for (const file of files) {
  replaceInFile(path.join(pagesDir, file));
}
console.log('Done 2!');
