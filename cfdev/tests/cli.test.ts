import { Command } from 'commander';
import { setupCommands } from '../src/index';

describe('CLI Entry Point', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    program.exitOverride(); // Prevent process.exit() during tests
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });


  describe('Help System', () => {
    it('should display help information', () => {
      program.name('cfdev').description('CLI tool for Contentful app development');
      
      expect(() => {
        program.parse(['--help'], { from: 'user' });
      }).toThrow(); // Commander throws with exitOverride
    });

    it('should have correct program name', () => {
      program.name('cfdev');
      expect(program.name()).toBe('cfdev');
    });

    it('should have correct description', () => {
      const description = 'CLI tool for Contentful app development and space management';
      program.description(description);
      expect(program.description()).toBe(description);
    });
  });

  describe('Command Registration', () => {
    beforeEach(() => {
      program.name('cfdev').description('Test CLI');
      setupCommands(program);
    });

    it('should register all expected commands', () => {
      const commands = program.commands.map(cmd => cmd.name());
      const expectedCommands = [
        'setup',
        'create-app-definition',
        'create-space',
        'add-team',
        'install-app',
        'delete-space',
        'delete-app-definition',
        'uninstall-app',
        'remove-team',
        'teardown',
        'list',
        'status'
      ];

      expectedCommands.forEach(expectedCommand => {
        expect(commands).toContain(expectedCommand);
      });
    });

    it('should have correct command descriptions', () => {
      const setupCommand = program.commands.find(cmd => cmd.name() === 'setup');
      expect(setupCommand?.description()).toBe('Complete automated setup workflow (create app definitions, spaces, assign teams, install apps)');

      const listCommand = program.commands.find(cmd => cmd.name() === 'list');
      expect(listCommand?.description()).toBe('List existing resources');
    });

    it('should have correct options for list command', () => {
      const listCommand = program.commands.find(cmd => cmd.name() === 'list');
      const options = listCommand?.options.map(opt => opt.long);
      
      expect(options).toContain('--spaces');
      expect(options).toContain('--apps');
      expect(options).toContain('--teams');
    });
  });

  describe('Command Parsing', () => {
    beforeEach(() => {
      program.name('cfdev').description('Test CLI');
      setupCommands(program);
    });

    it('should parse setup command correctly', () => {
      expect(() => {
        program.parse(['setup'], { from: 'user' });
      }).not.toThrow();
    });

    it('should parse create-space command correctly', () => {
      expect(() => {
        program.parse(['create-space'], { from: 'user' });
      }).not.toThrow();
    });

    it('should parse list command with options correctly', () => {
      expect(() => {
        program.parse(['list', '--spaces'], { from: 'user' });
      }).not.toThrow();
    });
  });
}); 