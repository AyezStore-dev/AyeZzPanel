import fs from 'fs';
import path from 'path';

async function copyAssets() {
  const srcDir = path.join(process.cwd(), 'node_modules', '@hazart-pkg', 'live2d-core');
  const destDir = path.join(process.cwd(), 'public');
  
  console.log(`Searching for Live2D files in: ${srcDir}`);
  if (!fs.existsSync(srcDir)) {
    console.error(`Source directory does not exist: ${srcDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(srcDir);
  console.log(`Files in @hazart-pkg/live2d-core:`, files);

  // Let's copy live2dcubismcore.min.js and live2dcubismcore.js to public/
  const minCoreFile = files.find(f => f.toLowerCase() === 'live2dcubismcore.min.js');
  const jsCoreFile = files.find(f => f.toLowerCase() === 'live2dcubismcore.js');
  
  if (minCoreFile && jsCoreFile) {
    const srcMinPath = path.join(srcDir, minCoreFile);
    const srcJsPath = path.join(srcDir, jsCoreFile);
    
    // Create public directory if not exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    const destPath1 = path.join(destDir, 'live2dcubismcore.min.js');
    const destPath2 = path.join(destDir, 'live2dcubismcore.js');
    
    fs.copyFileSync(srcMinPath, destPath1);
    fs.copyFileSync(srcJsPath, destPath2);
    
    console.log(`Copied ${minCoreFile} and ${jsCoreFile} to:`);
    console.log(`- ${destPath1}`);
    console.log(`- ${destPath2}`);
    console.log(`File size of min.js: ${fs.statSync(destPath1).size} bytes`);
    console.log(`File size of js: ${fs.statSync(destPath2).size} bytes`);
  } else {
    console.error(`Could not find live2dcubismcore file in the package.`);
    process.exit(1);
  }
}

copyAssets();
