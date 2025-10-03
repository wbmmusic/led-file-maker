/**
 * Type definitions for IPC (Inter-Process Communication) between
 * Electron main process and renderer process
 */

import { FileInfo, ExportConfig } from './fileFormat';

/**
 * Auto-updater event types
 */
export type UpdaterEvent = 
  | 'checking-for-update'
  | 'update-available'
  | 'update-not-available'
  | 'download-progress'
  | 'update-downloaded'
  | 'error';

/**
 * Update information payload
 */
export interface UpdateInfo {
  version: string;
  tag?: string;
  releaseDate?: string;
  releaseName?: string;
  releaseNotes?: string;
}

/**
 * Download progress information
 */
export interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

/**
 * Result from opening a .wbmani file
 */
export interface OpenFileResult {
  /** Raw file data */
  data: Buffer;
  /** Filename with extension */
  name: string;
}

/**
 * IPC channel names and their message types
 */
export interface IpcChannels {
  // Renderer -> Main (invoke)
  chooseFolder: {
    request: void;
    response: FileInfo[] | 'canceled';
  };
  clearImages: {
    request: void;
    response: FileInfo[];
  };
  chooseOutput: {
    request: void;
    response: string | 'canceled';
  };
  saveWbmAni: {
    request: { path: string; data: Buffer };
    response: 'saved';
  };
  openAniFile: {
    request: void;
    response: OpenFileResult | 'canceled';
  };
  cancelExport: {
    request: void;
    response: 'canceled';
  };

  // Renderer -> Main (send)
  reactIsReady: void;
  installUpdate: void;
  export: ExportConfig;

  // Main -> Renderer (receive)
  app_version: string;
  updater: [UpdaterEvent, UpdateInfo | DownloadProgress | Error | undefined];
  processedFrame: string; // filename
  finishedExport: void;
}
