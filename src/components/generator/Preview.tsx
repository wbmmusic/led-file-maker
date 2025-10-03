/**
 * Preview Component
 * 
 * Animated preview of the loaded image sequence with transformation preview.
 * Displays:
 * - Auto-playing animation of frames at ~30fps
 * - Current frame number and file metadata (dimensions, frame count)
 * - Two preview sizes: original and scaled (300px wide)
 * - Applied image transformations (horizontal/vertical flip)
 * 
 * The preview helps users verify their animation and transformation settings
 * before exporting.
 */

import React, { Fragment, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import { PreviewProps } from '../../types';

/**
 * Image sequence preview component with auto-play animation
 * 
 * @param props.files - Array of image files to preview
 * @param props.pause - Whether to pause the animation
 * @param props.imageOptions - Image transformation options (flip horizontal/vertical)
 * @returns The rendered preview display
 */
const Preview = ({ files, pause, imageOptions }: PreviewProps): JSX.Element => {
  // Current frame index being displayed
  const [state, setState] = useState<number>(0);

  /**
   * Render file metadata information
   * Shows frame count, width, and height of the images
   */
  const makeSize = (): JSX.Element | null => {
    if (files.length > 0) {
      return (
        <Fragment>
          <Box sx={{ marginLeft: '10px' }}>
            Frames: <b>{files.length}</b>
          </Box>
          <Box sx={{ marginLeft: '10px' }}>
            Width: <b>{files[0].width}</b>px
          </Box>
          <Box sx={{ marginLeft: '10px' }}>
            Height: <b>{files[0].height}</b>px
          </Box>
        </Fragment>
      );
    }
    return null;
  };

  /**
   * Animation loop effect
   * Automatically advances to next frame every 33ms (~30fps)
   * Pauses when the pause prop is true or when exporting
   */
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (!pause) {
      timer = setInterval(() => {
        setState(old => {
          // Loop back to start when reaching the end
          if (old >= files.length - 1) return 0;
          else return old + 1;
        });
      }, 33); // ~30fps
    }

    // Cleanup timer on unmount or when dependencies change
    return () => clearInterval(timer);
  }, [files, pause]);

  // Don't render if no files or options not set
  if (files.length <= 0 || !imageOptions) return <div></div>;

  /**
   * Generate CSS transform styles based on flip options
   * Applies scaleX(-1) for vertical flip and scaleY(-1) for horizontal flip
   * Note: The naming is inverted because the transform flips the opposite axis
   * 
   * @returns CSS transform object
   */
  const handleOptions = (): { transform: string } => {
    let out = '';
    if (imageOptions.flip.horizontal) out = out + 'scaleY(-1) ';
    if (imageOptions.flip.vertical) out = out + 'scaleX(-1)';
    return { transform: out.trim() };
  };

  return (
    <Box
      style={{ padding: '8px', backgroundColor: 'lightgray' }}
      component={Paper}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <b>Preview</b>
        {/* Current frame indicator */}
        <div
          style={{
            display: 'inline-block',
            marginLeft: '6px',
            fontSize: '12px',
            width: '40px',
            textAlign: 'center',
          }}
        >
          {state}
        </div>
        {/* File metadata */}
        {makeSize()}
      </div>
      <Divider style={{ marginBottom: '6px' }} />
      {/* Original size preview with transformations */}
      <img
        style={{ maxWidth: '100%', ...handleOptions() }}
        src={'atom://' + files[state].name}
        alt={files[state].name}
      />
      <div style={{ height: '6px' }} />
      {/* Fixed width (300px) preview with white border and transformations */}
      <img
        style={{
          width: '300px',
          border: '10px solid white',
          ...handleOptions(),
        }}
        src={'atom://' + files[state].name}
        alt={files[state].name}
      />
    </Box>
  );
};

export default Preview;
