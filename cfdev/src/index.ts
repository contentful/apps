import { Command } from 'commander';

export function setupCommands(program: Command): void {
  // Setup command - main workflow
  program
    .command('setup')
    .description('Complete automated setup workflow (create app definitions, spaces, assign teams, install apps)')
    .action(() => {
      console.log('🚀 cfdev setup command - Coming soon!');
    });

  // Management commands
  program
    .command('create-app-definition')
    .description('Create a new app definition')
    .action(() => {
      console.log('📱 cfdev create-app-definition command - Coming soon!');
    });

  program
    .command('create-space')
    .description('Create a new Contentful space')
    .action(() => {
      console.log('🏠 cfdev create-space command - Coming soon!');
    });

  program
    .command('add-team')
    .description('Add team to existing space with admin privileges')
    .action(() => {
      console.log('👥 cfdev add-team command - Coming soon!');
    });

  program
    .command('install-app')
    .description('Install app definition in existing space')
    .action(() => {
      console.log('⚙️ cfdev install-app command - Coming soon!');
    });

  // Delete commands
  program
    .command('delete-space')
    .description('Delete a Contentful space')
    .action(() => {
      console.log('🗑️ cfdev delete-space command - Coming soon!');
    });

  program
    .command('delete-app-definition')
    .description('Delete an app definition')
    .action(() => {
      console.log('🗑️ cfdev delete-app-definition command - Coming soon!');
    });

  program
    .command('uninstall-app')
    .description('Uninstall app from space')
    .action(() => {
      console.log('❌ cfdev uninstall-app command - Coming soon!');
    });

  program
    .command('remove-team')
    .description('Remove team from space')
    .action(() => {
      console.log('👥 cfdev remove-team command - Coming soon!');
    });

  // Utility commands
  program
    .command('teardown')
    .description('Delete all resources created by setup command')
    .action(() => {
      console.log('💥 cfdev teardown command - Coming soon!');
    });

  program
    .command('list')
    .description('List existing resources')
    .option('--spaces', 'List all spaces in organization')
    .option('--apps', 'List all app definitions')
    .option('--teams', 'List all teams')
    .action(() => {
      console.log('📋 cfdev list command - Coming soon!');
    });

  program
    .command('status')
    .description('Check status of app setup')
    .action(() => {
      console.log('📊 cfdev status command - Coming soon!');
    });
} 