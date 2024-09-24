const fs = require('fs').promises;
const path = require('path');

// Adjust PROJECT_ROOT to point to the actual project root
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'full_source_code.txt');

const INCLUDE_EXTENSIONS = ['.js', '.json', '.txt', '.csv', '.md', '.sql'];
const EXCLUDE_EXTENSIONS = ['.log', '.lock'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'logs', 'data', 'tests/test_output', 'frontend/build', 'backend/tmp'];
const EXCLUDE_FILES = ['package-lock.json', '.DS_Store', 'Thumbs.db'];

async function writeToFile(filePath, content) {
  await fs.appendFile(filePath, content, 'utf8');
}

function shouldIncludeFile(fileName) {
  const ext = path.extname(fileName);
  return INCLUDE_EXTENSIONS.includes(ext) && 
         !EXCLUDE_EXTENSIONS.includes(ext) &&
         !EXCLUDE_FILES.includes(fileName);
}

async function generateProjectStructure(dir, prefix = '') {
  let structure = '';
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDE_DIRS.includes(entry.name) || EXCLUDE_FILES.includes(entry.name)) continue;

    if (entry.isDirectory()) {
      structure += `${prefix}${entry.name}/\n`;
      structure += await generateProjectStructure(path.join(dir, entry.name), prefix + '  ');
    } else if (shouldIncludeFile(entry.name)) {
      structure += `${prefix}${entry.name}\n`;
    }
  }

  return structure;
}

async function processFile(filePath) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const content = await fs.readFile(filePath, 'utf8');
  
  await writeToFile(OUTPUT_FILE, `\n\n// File: ${path.basename(filePath)}\n`);
  await writeToFile(OUTPUT_FILE, `// Path: ${relativePath}\n\n`);
  await writeToFile(OUTPUT_FILE, content);
}

async function traverseDirectory(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        await traverseDirectory(fullPath);
      }
    } else if (entry.isFile() && shouldIncludeFile(entry.name)) {
      await processFile(fullPath);
    }
  }
}

async function exportSourceCode() {
  try {
    console.log('Starting source code export...');

    // Clear the output file if it exists
    await fs.writeFile(OUTPUT_FILE, '', 'utf8');

    // Write project information
    await writeToFile(OUTPUT_FILE, '// SHORT-VIDEO-CREATOR-SIMPLIFIED\n');
    await writeToFile(OUTPUT_FILE, `// Export Date: ${new Date().toISOString()}\n\n`);

    // Generate and write project structure
    console.log('Generating project structure...');
    const structure = await generateProjectStructure(PROJECT_ROOT);
    await writeToFile(OUTPUT_FILE, '// Project Structure:\n\n');
    await writeToFile(OUTPUT_FILE, structure);
    await writeToFile(OUTPUT_FILE, '\n// Source Code:\n');

    // Traverse the project directory and write file contents
    console.log('Exporting source code...');
    await traverseDirectory(PROJECT_ROOT);

    console.log(`Source code exported successfully to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error exporting source code:', error);
  }
}

exportSourceCode();