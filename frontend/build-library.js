#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building NgAdvancedGrid Library...\n');

try {
  // Check if ng-packagr is installed
  console.log('📦 Checking dependencies...');
  
  // Install ng-packagr if not present
  try {
    require.resolve('ng-packagr');
    console.log('✅ ng-packagr is installed');
  } catch (e) {
    console.log('📥 Installing ng-packagr...');
    execSync('npm install ng-packagr --save-dev', { stdio: 'inherit' });
  }

  // Build the library
  console.log('\n🔨 Building library...');
  execSync('ng build ng-advanced-grid', { stdio: 'inherit' });

  // Check if build was successful
  const distPath = path.join(__dirname, 'dist', 'ng-advanced-grid');
  if (fs.existsSync(distPath)) {
    console.log('\n✅ Library built successfully!');
    console.log(`📁 Output directory: ${distPath}`);
    
    // List the generated files
    const files = fs.readdirSync(distPath);
    console.log('\n📄 Generated files:');
    files.forEach(file => {
      const filePath = path.join(distPath, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(2);
      console.log(`   ${file} (${size} KB)`);
    });

    // Create package
    console.log('\n📦 Creating package...');
    process.chdir(distPath);
    execSync('npm pack', { stdio: 'inherit' });
    
    const packageFiles = fs.readdirSync('.').filter(f => f.endsWith('.tgz'));
    if (packageFiles.length > 0) {
      console.log(`\n✅ Package created: ${packageFiles[0]}`);
      console.log('\n🎉 Library is ready for publishing!');
      console.log('\nTo publish to npm:');
      console.log('1. cd dist/ng-advanced-grid');
      console.log('2. npm publish');
    }

  } else {
    console.error('❌ Build failed - output directory not found');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
