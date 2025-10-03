/**
 * Export Component
 * 
 * Displays real-time export progress during LED animation file generation.
 * Shows which frame is currently being processed and previews the image.
 * 
 * The export process:
 * 1. Sends export configuration to main process via IPC
 * 2. Receives progress updates as each frame is processed
 * 3. Displays the current frame name and preview image
 * 4. Notifies when export is complete
 */

import React, { useEffect, useState } from 'react';
import { ExportProps } from '../../types';

/**
 * Export progress display component
 * 
 * @param props.close - Callback to invoke when export completes
 * @param props.format - Color format for the export (rgb, bgr, etc.)
 * @param props.path - Output file path
 * @param props.imageOptions - Image transformation and pixel ordering options
 * @returns The rendered export progress display
 */
export default function Export({ close, format, path, imageOptions }: ExportProps): JSX.Element {
  // Current frame being processed
  const [frameName, setFrameName] = useState<string>('');

  useEffect(() => {
    // Send export command to main process with all configuration
    window.k.send('export', { format, path, imageOptions });

    /**
     * Listen for export completion
     * Called when all frames have been processed and file is saved
     */
    window.k.receive('finishedExport', () => {
      close();
    });

    /**
     * Listen for per-frame progress updates
     * Receives the filename of each frame as it's processed
     */
    window.k.receive('processedFrame', (filename: string) => {
      setFrameName(filename);
    });

    // Cleanup listeners on unmount
    return () => {
      window.k.removeListener('finishedExport');
      window.k.removeListener('processedFrame');
    };
  }, [close, format, imageOptions, path]);

  return (
    <div>
      <div>Processing {frameName}</div>
      {/* Preview of currently processing frame using custom atom:// protocol */}
      <img
        style={{ maxWidth: '100%' }}
        src={`atom://${frameName}`}
        alt="Current frame being processed"
      />
    </div>
  );
}
