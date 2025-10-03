/**
 * Player Component
 * 
 * Playback component for viewing .wbmani LED animation files.
 * 
 * Features:
 * - Opens .wbmani files and parses binary format
 * - Extracts header information (dimensions, frame count, color format)
 * - Renders frames to canvas at ~30fps
 * - Scales preview for viewing
 * - Auto-loops animation
 * 
 * The player decodes the binary format:
 * - Header (9 bytes): frame count, width, height, color format
 * - Frame data: Raw RGB pixel data for each frame
 * 
 * Pixel data is reordered based on the color format specified in the file header.
 */

import React, { Fragment, useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { PlayerProps, WbmAniFile, ColorFormat } from '../../types';

/**
 * LED animation player component
 * @returns The rendered player with controls and canvas
 */
export default function Player(_props: PlayerProps): JSX.Element {
  // State for loaded file and current frame
  const [file, setFile] = useState<Partial<WbmAniFile>>({ data: new Uint8Array() });
  const [frame, setFrame] = useState<number | null>(null);

  // Refs for canvas rendering
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  /**
   * Convert two bytes to a 16-bit number (big-endian)
   * Used for reading header values
   * 
   * @param highByte - Most significant byte
   * @param lowByte - Least significant byte
   * @returns Decoded number (0-65535)
   */
  const numberFromTwoBytes = (highByte: number, lowByte: number): number => {
    let out = 0;
    out = highByte << 8;
    out = out | lowByte;
    return out;
  };

  /**
   * Handle opening a .wbmani file
   * Shows file dialog and parses the file header
   */
  const handleOpenFile = (): void => {
    window.k
      .invoke('openAniFile')
      .then(res => {
        if (res !== 'canceled') {
          // Parse header from first 9 bytes
          const data = new Uint8Array(res.data);
          setFile({
            name: res.name,
            data: data,
            frames: numberFromTwoBytes(data[0], data[1]),
            width: numberFromTwoBytes(data[2], data[3]),
            height: numberFromTwoBytes(data[4], data[5]),
            format: String.fromCharCode(data[6], data[7], data[8]) as ColorFormat,
          });
        } else {
          console.log('File open canceled');
        }
      })
      .catch(err => console.error('Error opening file:', err));
  };

  /**
   * Effect: Initialize playback when file loads
   * Sets frame to 0 to start playback
   */
  useEffect(() => {
    if (file.data && file.data.length > 0) {
      console.log('File loaded:', file);
      setFrame(0);
    }
  }, [file]);

  /**
   * Effect: Render current frame to canvas and schedule next frame
   * This creates the animation loop
   */
  useEffect(() => {
    /**
     * Extract a range of bytes from the file data
     * @param start - Start index
     * @param length - Number of bytes to extract
     * @returns Array of bytes
     */
    const getBytes = (start: number, length: number): number[] => {
      const out: number[] = [];
      for (let i = 0; i < length; i++) {
        out.push(file.data![start + i]);
      }
      return out;
    };

    let timer: NodeJS.Timeout;
    
    if (frame === null || !file.width || !file.height || !file.data) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create ImageData for this frame
    const imageData = ctx.createImageData(file.width, file.height);

    // Calculate frame data location in file
    const numberOfPixels = file.width * file.height;
    const startOfFrame = frame * numberOfPixels * 3 + 9; // +9 for header

    // Extract frame data
    const frameData = getBytes(startOfFrame, numberOfPixels * 3);

    /**
     * Factory function to create color channel reordering function
     * Different LED files may store colors in different orders
     * This function reorders them to RGB for canvas display
     * 
     * @returns Function that reorders color channels to RGB
     */
    let getRGB: (a: number, b: number, c: number) => [number, number, number];

    switch (file.format) {
      case 'rgb':
        getRGB = (r, g, b) => [r, g, b];
        break;
      case 'rbg':
        getRGB = (r, b, g) => [r, g, b];
        break;
      case 'bgr':
        getRGB = (b, g, r) => [r, g, b];
        break;
      case 'brg':
        getRGB = (b, r, g) => [r, g, b];
        break;
      case 'grb':
        getRGB = (g, r, b) => [r, g, b];
        break;
      case 'gbr':
        getRGB = (g, b, r) => [r, g, b];
        break;
      default:
        getRGB = (r, g, b) => [r, g, b];
        break;
    }

    // Decode each pixel from frame data
    for (let i = 0; i < numberOfPixels; i++) {
      const data = getRGB(
        frameData[i * 3],
        frameData[i * 3 + 1],
        frameData[i * 3 + 2]
      );

      // Write pixel to ImageData (RGBA format)
      imageData.data[i * 4 + 0] = data[0]; // R
      imageData.data[i * 4 + 1] = data[1]; // G
      imageData.data[i * 4 + 2] = data[2]; // B
      imageData.data[i * 4 + 3] = 255;     // A (fully opaque)
    }

    // Render to canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to image for scaled preview
    if (imageRef.current) {
      imageRef.current.src = canvas.toDataURL();
    }

    // Schedule next frame (~30fps)
    timer = setTimeout(() => {
      setFrame(old => {
        if (old === null) return null;
        // Loop back to start when reaching end
        if (old + 1 >= file.frames!) return 0;
        return old + 1;
      });
    }, 33);

    // Cleanup timer on unmount or frame change
    return () => clearTimeout(timer);
  }, [frame, file]);

  /**
   * Render file information display
   * Shows current frame, filename, dimensions, and format
   */
  const makeInfo = (): JSX.Element | null => {
    if (file.data && file.data.length > 0 && frame !== null) {
      return (
        <Fragment>
          {/* Clear file button */}
          <Button size="small" color="error" onClick={() => setFrame(null)}>
            Clear File
          </Button>
          {/* Current frame number */}
          <div
            style={{
              display: 'inline-block',
              marginLeft: '10px',
              fontSize: '12px',
              width: '20px',
              textAlign: 'center',
            }}
          >
            {frame}
          </div>
          {/* Filename */}
          <div
            style={{
              display: 'inline-block',
              marginLeft: '10px',
              fontSize: '12px',
              textAlign: 'center',
            }}
          >
            {file.name}
          </div>
          {/* Frame count */}
          <div
            style={{
              display: 'inline-block',
              marginLeft: '10px',
              fontSize: '12px',
            }}
          >
            Frames: {file.frames}
          </div>
          {/* Resolution */}
          <div
            style={{
              display: 'inline-block',
              marginLeft: '10px',
              fontSize: '12px',
            }}
          >
            {' '}
            {'Res: ' + file.width + ' x ' + file.height}
          </div>
          {/* Color format */}
          <div
            style={{
              display: 'inline-block',
              marginLeft: '10px',
              fontSize: '12px',
            }}
          >
            {' '}
            {'Format: ' + file.format?.toUpperCase()}
          </div>
        </Fragment>
      );
    }
    return null;
  };

  /**
   * Render player canvas and preview
   * Shows both original size canvas and scaled preview
   */
  const makePlayer = (): JSX.Element | null => {
    if (!file.data || file.data.length <= 0 || frame === null || !file.width || !file.height) {
      return null;
    }

    return (
      <div>
        {/* Original size canvas (hidden, used for rendering) */}
        <canvas 
          ref={canvasRef} 
          width={file.width} 
          height={file.height}
          style={{ display: 'none' }}
        />
        {/* Scaled preview image */}
        <div>
          <img
            style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }}
            ref={imageRef}
            src=""
            alt="Animation preview"
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button size="small" onClick={handleOpenFile}>
          Open File
        </Button>
        {makeInfo()}
      </div>
      <Divider style={{ marginBottom: '6px' }} />
      {/* Player canvas */}
      {makePlayer()}
    </div>
  );
}
