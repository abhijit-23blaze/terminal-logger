#!/usr/bin/env node

const { Command } = require('commander');
const CryptoJS = require('crypto-js');
const fs = require('fs-extra');
const moment = require('moment');
const readline = require('readline');
const chalk = require('chalk'); // Add this dependency for color styling

const program = new Command();
const ENCRYPTION_KEY = 'your-secret-key';
const LOG_FILE = 'batcave_records.json';

// Batman-themed ASCII art logo
const batLogo = `
${chalk.green('             _,  _     _,_')}
${chalk.green('  .o888P     Y8o8Y     Y888o.')}
${chalk.green(' d88888      88888      88888b')}
${chalk.green('d888888b_  _d88888b_  _d888888b')}
${chalk.green('8888888888888888888888888888888')}
${chalk.green('8888888888888888888888888888888')}
${chalk.green('YJGS8P"Y888P"Y888P"Y888P"Y8888P')}
${chalk.green(' Y888   \'8\'   Y8P   \'8\'   888Y')}
${chalk.green('  \'8o          V          o8\'')}
${chalk.green('    `                    `')}
`;

function displayBatLogo() {



  console.log(batLogo);
  console.log(chalk.green('\n'));
}





function encryptData(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
}

function decryptData(encryptedData) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

async function addNote(options) {
    displayBatLogo();
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  
    // Get note with improved prompt
    console.log(chalk.green('✎ Enter your note (press Ctrl+D on a new line to finish): \n \n'));
    let note = '';
    
    if (options.quick) {
      note = options.quick;
    } else {
      // Multi-line input support
      const lines = [];
      rl.on('line', (line) => {
        lines.push(line);
      });
      
      await new Promise(resolve => rl.on('close', resolve));
      note = lines.join('\n');
    }
  
    rl.close();
  
    // Add metadata
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    const location = options.location || 'Gotham City';
    const priority = options.priority || 'normal';
    const tags = options.tags ? options.tags.split(',') : [];
    
    const data = { 
      timestamp, 
      note, 
      location,
      priority,
      tags
    };
  
    let logs = [];
    if (await fs.pathExists(LOG_FILE)) {
      const encryptedData = await fs.readFile(LOG_FILE, 'utf8');
      logs = decryptData(encryptedData);
    }
  
    logs.push(data);
    const encryptedLogs = encryptData(logs);
    await fs.writeFile(LOG_FILE, encryptedLogs);
  
    console.log(chalk.green('\n🦇 Note added to the Batcave records!'));
  }
  
  async function viewNotes(options) {
    displayBatLogo();
    
    if (await fs.pathExists(LOG_FILE)) {
      const encryptedData = await fs.readFile(LOG_FILE, 'utf8');
      const logs = decryptData(encryptedData);
      
      // Filter logs based on options
      let filteredLogs = logs;
      if (options.tag) {
        filteredLogs = logs.filter(log => log.tags && log.tags.includes(options.tag));
      }
      if (options.priority) {
        filteredLogs = filteredLogs.filter(log => log.priority === options.priority);
      }
      if (options.date) {
        filteredLogs = filteredLogs.filter(log => log.timestamp.startsWith(options.date));
      }
      
      console.log(chalk.green('📋 BATCAVE RECORDS:'));
      console.log(chalk.gray('═════════════════════════════════════════════\n'));
      
      filteredLogs.forEach(({ timestamp, note, location, priority, tags }, index) => {
        const priorityColor = 
          priority === 'high' ? chalk.red :
          priority === 'medium' ? chalk.green :
          chalk.green;
        
        console.log(chalk.cyan(`[${timestamp}]`) + 
          chalk.gray(` | Location: ${location} | `) + 
          priorityColor(`Priority: ${priority}`));
        
        if (tags && tags.length > 0) {
          console.log(chalk.magenta(`Tags: ${tags.join(', ')}`));
        }
        
        console.log(chalk.white(note));
        console.log(chalk.gray('─────────────────────────────────────────────\n'));
      });
      
      console.log(chalk.green(`Total records: ${filteredLogs.length}`));
    } else {
      console.log(chalk.red('The Batcave records are empty. Nothing to display.'));
    }
  }
  
  async function searchNotes(term) {
    displayBatLogo();
    
    if (!term) {
      console.log(chalk.red('Please provide a search term.'));
      return;
    }
    
    if (await fs.pathExists(LOG_FILE)) {
      const encryptedData = await fs.readFile(LOG_FILE, 'utf8');
      const logs = decryptData(encryptedData);
      
      const results = logs.filter(log => 
        log.note.toLowerCase().includes(term.toLowerCase()) ||
        (log.tags && log.tags.some(tag => tag.toLowerCase().includes(term.toLowerCase())))
      );
      
      console.log(chalk.green(`🔍 SEARCH RESULTS FOR: "${term}"`));
      console.log(chalk.gray('═════════════════════════════════════════════\n'));
      
      if (results.length > 0) {
        results.forEach(({ timestamp, note, location, priority, tags }, index) => {
          console.log(chalk.cyan(`[${timestamp}]`) + chalk.gray(` | Location: ${location}`));
          console.log(chalk.white(note));
          console.log(chalk.gray('─────────────────────────────────────────────\n'));
        });
        
        console.log(chalk.green(`Found ${results.length} matching records.`));
      } else {
        console.log(chalk.red('No matching records found in the Batcave.'));
      }
    } else {
      console.log(chalk.red('The Batcave records are empty. Nothing to search.'));
    }
  }
  
  async function deleteNote(index) {
    displayBatLogo();
    
    if (await fs.pathExists(LOG_FILE)) {
      const encryptedData = await fs.readFile(LOG_FILE, 'utf8');
      const logs = decryptData(encryptedData);
      
      if (index >= 0 && index < logs.length) {
        const deletedNote = logs.splice(index, 1)[0];
        
        const encryptedLogs = encryptData(logs);
        await fs.writeFile(LOG_FILE, encryptedLogs);
        
        console.log(chalk.green(`Note from ${deletedNote.timestamp} successfully deleted.`));
      } else {
        console.log(chalk.red(`Invalid index. Please provide a number between 0 and ${logs.length - 1}.`));
      }
    } else {
      console.log(chalk.red('The Batcave records are empty. Nothing to delete.'));
    }
  }

  program
  .version('1.0.0')
  .description(chalk.green('---------BAT CAVE RECORDS----------\n'));

program
  .command('add')
  .description('Add a new note to the Batcave records')
  .option('-q, --quick <note>', 'Quickly add a note without interactive prompt')
  .option('-l, --location <location>', 'Specify location (default: Gotham City)')
  .option('-p, --priority <priority>', 'Set priority (high, medium, low)')
  .option('-t, --tags <tags>', 'Add comma-separated tags')
  .action(addNote);

program
  .command('view')
  .description('View all notes in the Batcave records')
  .option('-t, --tag <tag>', 'Filter by tag')
  .option('-p, --priority <priority>', 'Filter by priority')
  .option('-d, --date <date>', 'Filter by date (YYYY-MM-DD)')
  .action(viewNotes);

program
  .command('search <term>')
  .description('Search the Batcave records')
  .action(searchNotes);

program
  .command('delete <index>')
  .description('Delete a note from the Batcave records')
  .action(deleteNote);

// Add a default action when no command is provided
program
  .action(() => {
    displayBatLogo();
    program.help();
  });

program.parse(process.argv);
