/// <reference types="jest" />

import { Command } from 'commander';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export interface CLITestResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface MockConsole {
  log: jest.MockedFunction<typeof console.log>;
  error: jest.MockedFunction<typeof console.error>;
  warn: jest.MockedFunction<typeof console.warn>;
}

/**
 * Capture console output for testing
 */
export function mockConsole(): MockConsole {
  const mockLog = jest.fn();
  const mockError = jest.fn();
  const mockWarn = jest.fn();

  console.log = mockLog;
  console.error = mockError;
  console.warn = mockWarn;

  return {
    log: mockLog,
    error: mockError,
    warn: mockWarn
  };
}

/**
 * Restore console functions
 */
export function restoreConsole(): void {
  jest.restoreAllMocks();
}

/**
 * Execute CLI command and capture output
 */
export async function executeCLI(args: string[]): Promise<CLITestResult> {
  const cliPath = join(__dirname, '../../dist/cli.js');
  
  return new Promise((resolve, reject) => {
    const child = spawn('node', [cliPath, ...args], {
      stdio: 'pipe',
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        exitCode: code || 0,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Create a fresh Commander program for testing
 */
export function createTestProgram(): Command {
  const program = new Command();
  program.exitOverride(); // Prevent process.exit() in tests
  return program;
}

/**
 * Parse CLI arguments safely for testing
 */
export function parseArgs(program: Command, args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      program.parse(args, { from: 'user' });
      resolve(program);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Check if the compiled CLI file exists
 */
export function checkCLIExists(): boolean {
  const cliPath = join(__dirname, '../../dist/cli.js');
  return existsSync(cliPath);
}

/**
 * Helper to test command output
 */
export function expectOutput(consoleMock: MockConsole, expectedOutput: string): void {
  const allOutput = consoleMock.log.mock.calls.map(call => call[0]).join('\n');
  expect(allOutput).toContain(expectedOutput);
}

/**
 * Helper to test command execution without output
 */
export function expectCommandCalled(consoleMock: MockConsole, commandName: string): void {
  const allOutput = consoleMock.log.mock.calls.map(call => call[0]).join('\n');
  expect(allOutput).toContain(`${commandName} command`);
}

/**
 * Mock process.argv for testing
 */
export function mockProcessArgv(args: string[]): void {
  const originalArgv = process.argv;
  process.argv = ['node', 'cli.js', ...args];
  
  // Restore after test
  afterEach(() => {
    process.argv = originalArgv;
  });
} 