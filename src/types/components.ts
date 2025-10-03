/**
 * Type definitions for React component props and state
 */

import { FileInfo, ImageOptions, ColorFormat } from './fileFormat';

/**
 * Props for the Generator component
 */
export interface GeneratorProps {}

/**
 * Props for the Player component
 */
export interface PlayerProps {}

/**
 * Props for the Top (main navigation) component
 */
export interface TopProps {}

/**
 * Props for the Updates component
 */
export interface UpdatesProps {}

/**
 * Props for the Export component
 */
export interface ExportProps {
  /** Callback to close the export modal */
  close: (data?: any) => void;
  /** Color format for export */
  format: ColorFormat;
  /** Output file path */
  path: string;
  /** Image transformation options */
  imageOptions: ImageOptions;
}

/**
 * Props for the Preview component
 */
export interface PreviewProps {
  /** Array of image files to preview */
  files: FileInfo[];
  /** Whether to pause the preview animation */
  pause: boolean;
  /** Image transformation options for preview */
  imageOptions: ImageOptions | null;
  /** Optional style overrides */
  style?: React.CSSProperties;
}

/**
 * Props for the ImageOptions component
 */
export interface ImageOptionsProps {
  /** Callback when options change */
  setOptions: (options: ImageOptions) => void;
}

/**
 * Error modal state structure
 */
export interface ErrorModalState {
  /** Whether the error modal is visible */
  show: boolean;
  /** Error message to display */
  message: string;
  /** Additional error data (e.g., conflicting file types) */
  data: Array<{
    type?: string;
    width: number;
    height: number;
  }>;
}

/**
 * Export modal state structure
 */
export interface ExportModalState {
  /** Whether the export modal is visible */
  show: boolean;
  /** Output file path (if modal is open) */
  outPath?: string;
}

/**
 * Download snackbar state for updates
 */
export interface DownloadSnackState {
  /** Whether download notification is visible */
  show: boolean;
  /** Download progress percentage (0-100) */
  progress: number;
}

/**
 * Install snackbar state for updates
 */
export interface InstallSnackState {
  /** Whether install notification is visible */
  show: boolean;
  /** Version number to be installed */
  version: string;
}
