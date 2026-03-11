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
  /** Total frames in animation */
  frames: number;
  /** Frame width in pixels */
  width: number;
  /** Frame height in pixels */
  height: number;
  /** Stored channel format (rgb/rbg/...) */
  format: string;
  /** File size in bytes */
  fileSize: number;
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
  getAniFrame: {
    request: { index: number };
    response: ArrayBuffer;
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
  openAniProgress: {
    phase: 'start' | 'reading' | 'done' | 'error';
    loaded: number;
    total: number;
    percent: number;
  };
}
