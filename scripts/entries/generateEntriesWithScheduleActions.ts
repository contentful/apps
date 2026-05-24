#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateEnvironment } from './utils.ts';
import { generateEntries } from './generateEntries.ts';

// Load environment variables from .env file in scripts directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export async function generateEntriesWithScheduleActions() {
  validateEnvironment();
  const { SCHEDULED_DATE } = process.env;

  const contentTypeName = 'Scheduled - All Field Types';

  const options = {
    useScheduleAction: !!SCHEDULED_DATE,
    scheduledDate: SCHEDULED_DATE ?? '2026-12-12T12:00:00.000Z',
  };

  generateEntries(contentTypeName, options);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateEntriesWithScheduleActions();
}
