#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 Testing Angular build...\n');

try {
  console.log('📦 Building application...');
  execSync('ng build --configuration development', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('\n✅ Build successful!');
  console.log('\n🚀 Starting development server...');
  
  // Start the dev server
  execSync('ng serve --port 4200', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
