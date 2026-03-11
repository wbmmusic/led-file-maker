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
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
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
export default function Export({ close, format, path, imageOptions, totalFrames }: ExportProps): JSX.Element {
  // Current frame being processed
  const [frameName, setFrameName] = useState<string>('');
  const [processedFrames, setProcessedFrames] = useState<number>(0);

  const safeTotalFrames = Math.max(totalFrames, 1);
  const progress = Math.min(100, Math.round((processedFrames / safeTotalFrames) * 100));

  useEffect(() => {
    setProcessedFrames(0);
    setFrameName('');

    // Send export command to main process with all configuration
    window.k.send('export', { format, path, imageOptions });

    /**
     * Listen for export completion
     * Called when all frames have been processed and file is saved
     */
    window.k.receive('finishedExport', () => {
      setProcessedFrames(safeTotalFrames);
      close();
    });

    /**
     * Listen for per-frame progress updates
     * Receives the filename of each frame as it's processed
     */
    window.k.receive('processedFrame', (filename: string) => {
      setFrameName(filename);
      setProcessedFrames(prev => Math.min(prev + 1, safeTotalFrames));
    });

    // Cleanup listeners on unmount
    return () => {
      window.k.removeListener('finishedExport');
      window.k.removeListener('processedFrame');
    };
  }, [close, format, imageOptions, path, safeTotalFrames]);

  return (
    <Box sx={{ mt: 1 }}>
      <Typography sx={{ fontSize: 13, mb: 0.6, color: '#2d3f5f' }}>
        {`Processed ${processedFrames}/${safeTotalFrames} frames (${progress}%)`}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ height: 8, borderRadius: 4, mb: 1.2, backgroundColor: '#e5edf7' }}
      />
      <Typography sx={{ fontSize: 12, mb: 0.8, color: '#445a7d' }}>
        {frameName ? `Processing ${frameName}` : 'Preparing export...'}
      </Typography>
      {/* Preview of currently processing frame using custom atom:// protocol */}
      {frameName && (
        <img
          style={{ maxWidth: '100%' }}
          src={`atom://${frameName}`}
          alt="Current frame being processed"
        />
      )}
    </Box>
  );
}
