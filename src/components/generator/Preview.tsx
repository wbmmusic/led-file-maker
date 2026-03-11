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
import Typography from '@mui/material/Typography';
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
          <Box sx={chipStyle}>
            Frames: <b>{files.length}</b>
          </Box>
          <Box sx={chipStyle}>
            Width: <b>{files[0].width}</b>px
          </Box>
          <Box sx={chipStyle}>
            Height: <b>{files[0].height}</b>px
          </Box>
          <Box sx={chipStyle}>
            Frame: <b>{state + 1}</b>
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
    
    if (!pause && files.length > 1) {
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
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid #d4dde8',
        background: 'linear-gradient(180deg, #f9fbff 0%, #f2f5fb 100%)',
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 20, letterSpacing: 0.2 }}>
          Preview
        </Typography>
        {makeSize()}
      </Box>

      <Divider sx={{ my: 1.5 }} />

      <Box
        sx={{
          p: 1.5,
          borderRadius: 1.5,
          border: '1px solid #d8dfec',
          background:
            'repeating-conic-gradient(#eef2f9 0% 25%, #f8faff 0% 50%) 50% / 14px 14px',
        }}
      >
        <img
          style={{
            width: '100%',
            maxHeight: '260px',
            minHeight: '64px',
            objectFit: 'contain',
            display: 'block',
            imageRendering: 'pixelated',
            ...handleOptions(),
          }}
          src={'atom://' + files[state].name}
          alt={files[state].name}
        />
      </Box>
    </Paper>
  );
};

const chipStyle = {
  px: 1,
  py: 0.35,
  borderRadius: 1,
  fontSize: 12,
  color: '#31415a',
  border: '1px solid #c8d4e7',
  backgroundColor: '#ffffffcc',
};

export default Preview;
