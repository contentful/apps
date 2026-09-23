import { useCallback, useState } from 'react';
import type { PageAppSDK } from '@contentful/app-sdk';
import { invokeListAction } from './invokeAction';
import { parseLogFile } from './parseLogFile';
import { normalizeEvent, type AuditEvent } from './events';
import { fetchDirectory, applyDirectory, type Directory } from './directory';
import type { LogFileRef } from './types';

export type LoadState =
  | { status: 'idle' }
  | { status: 'loading'; done: number; total: number }
  | {
      status: 'ready';
      events: AuditEvent[];
      files: LogFileRef[];
      truncated: boolean;
      failedFiles: string[];
    }
  | { status: 'error'; message: string };

const CONCURRENCY = 4;

let directoryPromise: Promise<Directory> | null = null;

export function useAuditLogs(sdk: PageAppSDK) {
  const [state, setState] = useState<LoadState>({ status: 'idle' });

  const load = useCallback(
    async (startDate: string, endDate: string) => {
      setState({ status: 'loading', done: 0, total: 0 });
      try {
        directoryPromise ??= fetchDirectory(sdk);
        const { files, truncated } = await invokeListAction(sdk, { startDate, endDate });
        setState({ status: 'loading', done: 0, total: files.length });
        const events: AuditEvent[] = [];
        const failedFiles: string[] = [];
        const queue = [...files];
        let done = 0;
        const worker = async () => {
          for (let f = queue.shift(); f; f = queue.shift()) {
            try {
              const res = await fetch(f.url);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              for (const raw of await parseLogFile(await res.arrayBuffer())) {
                const ev = normalizeEvent(raw);
                if (ev) events.push(ev);
              }
            } catch {
              failedFiles.push(f.key);
            }
            done += 1;
            setState({ status: 'loading', done, total: files.length });
          }
        };
        await Promise.all(
          Array.from({ length: Math.min(CONCURRENCY, Math.max(files.length, 1)) }, worker)
        );
        events.sort((a, b) => b.time - a.time);
        const dir = await directoryPromise;
        if (dir.users.size === 0 && dir.spaces.size === 0) directoryPromise = null;
        const resolved = applyDirectory(events, dir);
        setState({ status: 'ready', events: resolved, files, truncated, failedFiles });
      } catch (e) {
        setState({ status: 'error', message: e instanceof Error ? e.message : String(e) });
      }
    },
    [sdk]
  );

  return { state, load };
}
