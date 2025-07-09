#!/usr/bin/env node

import { Command } from 'commander';
import { setupCommands } from './index';

const pkg = require('../package.json');

// Create the CLI program
const program = new Command();

// Set up the CLI program
program
  .name('cfdev')
  .description(pkg.description)
  .version(pkg.version);

// Setup all commands
setupCommands(program);

// Parse command line arguments
program.parse(process.argv); 