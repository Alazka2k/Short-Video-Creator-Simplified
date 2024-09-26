const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const llmService = require('../backend/services/llm-service');
const logger = require('../backend/shared/utils/logger');

const docsStructure = [
    { path: 'content/docs/_index.md', title: 'Documentation' },
    { path: 'content/docs/1_getting-started/_index.md', title: '1. Getting Started' },
    { path: 'content/docs/2_architecture/_index.md', title: '2. Architecture' },
    { path: 'content/docs/3_functionalities/_index.md', title: '3. Functionalities' },
    { path: 'content/docs/4_api-reference/_index.md', title: '4. API Reference' }
];

async function executeCommand(command) {
    try {
        const output = execSync(command, { encoding: 'utf8' });
        logger.info(`Command executed: ${command}`);
        logger.debug(output);
        return output;
    } catch (error) {
        logger.error(`Error executing command: ${command}`);
        logger.error(error);
        throw error;
    }
}

async function getProjectDescription() {
    const readmePath = path.join(__dirname, '..', 'README.md');
    try {
        return await fs.readFile(readmePath, 'utf8');
    } catch (error) {
        logger.error('Error reading README.md:', error);
        return "Error reading project description from README.md";
    }
}

async function generateDocContent(title, projectDescription) {
    const prompt = `Generate documentation content for a section titled "${title}" in a software project. Use the following project description as context:\n\n${projectDescription}\n\nProvide a detailed markdown-formatted content suitable for a technical audience.`;
    
    logger.info(`Generating content for "${title}"`);

    try {
        const content = await llmService.generateDocContent(prompt);
        logger.info(`Content generated successfully for "${title}"`);
        return content.description || `# ${title}\n\nContent generation failed. Please add content manually.`;
    } catch (error) {
        logger.error(`Error generating content for ${title}:`, error);
        return `# ${title}\n\nContent generation failed. Please add content manually.`;
    }
}

async function promptUser(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function checkHugoInstallation() {
    try {
        const hugoVersion = await executeCommand('hugo version');
        logger.info(`Hugo is installed. Version: ${hugoVersion.trim()}`);
        return true;
    } catch (error) {
        logger.error('Hugo is not installed or not found in PATH.');
        logger.info('Please install Hugo manually:');
        logger.info('1. Visit https://gohugo.io/installation/ for installation instructions');
        logger.info('2. For Windows users:');
        logger.info('   a. Download the Hugo executable from https://github.com/gohugoio/hugo/releases');
        logger.info('   b. Extract the zip file and place hugo.exe in a directory of your choice');
        logger.info('   c. Add that directory to your system\'s PATH environment variable');
        logger.info('3. For macOS users with Homebrew: brew install hugo');
        logger.info('4. For Linux users: Use your distribution\'s package manager or snap install hugo');
        logger.info('After installation, restart your terminal and run this script again.');
        return false;
    }
}

async function setupHugoDocs() {
    try {
        logger.info('Starting Hugo docs setup...');

        const projectRoot = path.resolve(__dirname, '..');
        const docsDir = path.join(projectRoot, 'docs');
        const projectDescription = await getProjectDescription();

        logger.info('Project Description loaded');

        logger.info('Checking Hugo installation...');
        if (!await checkHugoInstallation()) {
            logger.error('Hugo is required to generate documentation. Please install Hugo and try again.');
            return;
        }

        logger.info('Creating new Hugo site...');
        await executeCommand(`hugo new site ${docsDir} --force`);
        
        process.chdir(docsDir);

        logger.info('Initializing new Hugo site...');
        await executeCommand('git init');
        await executeCommand('git submodule add https://github.com/google/docsy.git themes/docsy');
        await executeCommand('git submodule update --init --recursive');

        // Create package.json
        const packageJson = {
            "name": "short-video-creator-simplified-docs",
            "version": "1.0.0",
            "description": "Documentation for SHORT-VIDEO-CREATOR-SIMPLIFIED",
            "scripts": {
                "start": "hugo server",
                "build": "hugo"
            },
            "dependencies": {},
            "devDependencies": {
                "autoprefixer": "^10.4.0",
                "postcss-cli": "^10.1.0"
            }
        };
        await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));

        // Install dependencies
        await executeCommand('npm install');

        // Write the updated hugo.toml content
        const hugoConfig = `
baseURL = 'http://example.org/'
languageCode = 'en-us'
title = 'SHORT-VIDEO-CREATOR-SIMPLIFIED Documentation'

# Theme settings
theme = "docsy"

# Docsy theme settings
[params]
  copyright = "The SHORT-VIDEO-CREATOR-SIMPLIFIED Authors"
  github_repo = "https://github.com/alazka2k/SHORT-VIDEO-CREATOR-SIMPLIFIED"

[module]
  proxy = "direct"
  # uncomment line below for temporary local development of module
  # replacements = "github.com/google/docsy -> ../../docsy"
  [module.hugoVersion]
    extended = true
    min = "0.110.0"
  [[module.imports]]
    path = "github.com/google/docsy"
    disable = false
  [[module.imports]]
    path = "github.com/google/docsy/dependencies"
    disable = false
`;
        await fs.writeFile('hugo.toml', hugoConfig);

        // Initialize and update Hugo modules
        await executeCommand('hugo mod init github.com/alazka2k/SHORT-VIDEO-CREATOR-SIMPLIFIED');
        await executeCommand('hugo mod get -u ./...');
        await executeCommand('hugo mod tidy');

        // Prompt user for action
        const action = await promptUser("Do you want to recreate all docs or choose specific sections? (all/specific): ");

        if (action.toLowerCase() === 'all') {
            for (const item of docsStructure) {
                const content = await generateDocContent(item.title, projectDescription);
                const filePath = path.join(docsDir, item.path);
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, content);
                logger.info(`Created ${item.path}`);
            }
        } else if (action.toLowerCase() === 'specific') {
            const choices = docsStructure.map((item, index) => `${index + 1}. ${item.title}`).join('\n');
            const selection = await promptUser(`Choose the number(s) of the section(s) to recreate (comma-separated):\n${choices}\n`);
            const selectedIndices = selection.split(',').map(s => parseInt(s.trim()) - 1);

            for (const index of selectedIndices) {
                if (index >= 0 && index < docsStructure.length) {
                    const item = docsStructure[index];
                    const content = await generateDocContent(item.title, projectDescription);
                    const filePath = path.join(docsDir, item.path);
                    await fs.mkdir(path.dirname(filePath), { recursive: true });
                    await fs.writeFile(filePath, content);
                    logger.info(`Created ${item.path}`);
                }
            }
        } else {
            logger.info("Invalid action. No documents were created or updated.");
            return;
        }

        // Build the site
        await executeCommand('hugo --minify');

        logger.info("Hugo site has been built successfully.");
        logger.info("Hugo site has been updated in the 'docs' folder.");
        logger.info("To serve the site locally, run: cd docs && hugo server");
    } catch (error) {
        logger.error('Error setting up Hugo docs:', error);
        throw error;
    }
}

// If you're running this script directly:
if (require.main === module) {
    setupHugoDocs().catch(error => {
        logger.error('Unhandled error in setupHugoDocs:', error);
        process.exit(1);
    });
}

module.exports = { setupHugoDocs };