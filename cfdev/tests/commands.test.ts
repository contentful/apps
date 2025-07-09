import { Command } from 'commander';
import { setupCommands } from '../src/index';

describe('Command Execution', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    program.exitOverride(); // Prevent process.exit() during tests
    program.name('cfdev').description('Test CLI');
    setupCommands(program);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Setup Command', () => {
    it('should execute setup command and display coming soon message', () => {
      program.parse(['setup'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('🚀 cfdev setup command - Coming soon!');
    });
  });

  describe('Management Commands', () => {
    it('should execute create-app-definition command', () => {
      program.parse(['create-app-definition'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('📱 cfdev create-app-definition command - Coming soon!');
    });

    it('should execute create-space command', () => {
      program.parse(['create-space'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('🏠 cfdev create-space command - Coming soon!');
    });

    it('should execute add-team command', () => {
      program.parse(['add-team'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('👥 cfdev add-team command - Coming soon!');
    });

    it('should execute install-app command', () => {
      program.parse(['install-app'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('⚙️ cfdev install-app command - Coming soon!');
    });
  });

  describe('Delete Commands', () => {
    it('should execute delete-space command', () => {
      program.parse(['delete-space'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('🗑️ cfdev delete-space command - Coming soon!');
    });

    it('should execute delete-app-definition command', () => {
      program.parse(['delete-app-definition'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('🗑️ cfdev delete-app-definition command - Coming soon!');
    });

    it('should execute uninstall-app command', () => {
      program.parse(['uninstall-app'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('❌ cfdev uninstall-app command - Coming soon!');
    });

    it('should execute remove-team command', () => {
      program.parse(['remove-team'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('👥 cfdev remove-team command - Coming soon!');
    });
  });

  describe('Utility Commands', () => {
    it('should execute teardown command', () => {
      program.parse(['teardown'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('💥 cfdev teardown command - Coming soon!');
    });

    it('should execute list command', () => {
      program.parse(['list'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('📋 cfdev list command - Coming soon!');
    });

    it('should execute list command with --spaces option', () => {
      program.parse(['list', '--spaces'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('📋 cfdev list command - Coming soon!');
    });

    it('should execute list command with --apps option', () => {
      program.parse(['list', '--apps'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('📋 cfdev list command - Coming soon!');
    });

    it('should execute list command with --teams option', () => {
      program.parse(['list', '--teams'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('📋 cfdev list command - Coming soon!');
    });

    it('should execute status command', () => {
      program.parse(['status'], { from: 'user' });
      expect(consoleSpy).toHaveBeenCalledWith('📊 cfdev status command - Coming soon!');
    });
  });

  describe('Command Help', () => {
    it('should display help for setup command', () => {
      expect(() => {
        program.parse(['setup', '--help'], { from: 'user' });
      }).toThrow(); // Commander throws with exitOverride when showing help
    });

    it('should display help for list command', () => {
      expect(() => {
        program.parse(['list', '--help'], { from: 'user' });
      }).toThrow(); // Commander throws with exitOverride when showing help
    });
  });
}); 