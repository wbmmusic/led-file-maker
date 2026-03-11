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

import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import CropFreeIcon from '@mui/icons-material/CropFree';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import { PlayerProps, WbmAniFile } from '../../types';

/**
 * LED animation player component
 * @returns The rendered player with controls and canvas
 */
export default function Player(props: PlayerProps): JSX.Element {
  const { file: propFile } = props;

  // State for current frame
  const [frame, setFrame] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'fit' | 'actual'>('fit');
  const file: Partial<WbmAniFile> = propFile ?? {};

  // Refs for canvas rendering
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const frameCacheRef = useRef<Map<number, Uint8Array>>(new Map());
  const rafRef = useRef<number | null>(null);
  const timelineStartRef = useRef<number | null>(null);

  const normalizeFramePayload = (raw: any): Uint8Array => {
    if (raw instanceof Uint8Array) return raw;
    if (ArrayBuffer.isView(raw)) return new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
    if (raw instanceof ArrayBuffer) return new Uint8Array(raw);
    if (raw && raw.type === 'Buffer' && Array.isArray(raw.data)) return Uint8Array.from(raw.data);
    if (Array.isArray(raw)) return Uint8Array.from(raw);
    throw new Error('Unknown getAniFrame payload shape');
  };

  const getFrameData = async (index: number): Promise<Uint8Array> => {
    const cached = frameCacheRef.current.get(index);
    if (cached) {
      return cached;
    }
    const raw = await window.k.invoke('getAniFrame', { index });
    const normalized = normalizeFramePayload(raw);
    frameCacheRef.current.set(index, normalized);
    // Evict oldest when cache exceeds 10 frames
    if (frameCacheRef.current.size > 10) {
      const firstKey = frameCacheRef.current.keys().next().value;
      if (firstKey !== undefined) frameCacheRef.current.delete(firstKey);
    }
    return normalized;
  };

  // Build color format offset lookup table once
  const getColorOffsets = React.useMemo(() => {
    let redOffset = 0, greenOffset = 1, blueOffset = 2;
    switch (file.format) {
      case 'rbg':
        redOffset = 0; greenOffset = 2; blueOffset = 1; break;
      case 'bgr':
        redOffset = 2; greenOffset = 1; blueOffset = 0; break;
      case 'brg':
        redOffset = 1; greenOffset = 2; blueOffset = 0; break;
      case 'grb':
        redOffset = 1; greenOffset = 0; blueOffset = 2; break;
      case 'gbr':
        redOffset = 2; greenOffset = 0; blueOffset = 1; break;
      default:
        redOffset = 0; greenOffset = 1; blueOffset = 2; break;
    }
    return { redOffset, greenOffset, blueOffset };
  }, [file.format]);

  const getBaseFrameIntervalMs = (): number => {
    if (!file.width || !file.height) return 33;
    const numberOfPixels = file.width * file.height;
    return numberOfPixels >= 120000 ? 66 : 33;
  };

  const getFrameIntervalMs = (): number => Math.max(12, Math.round(getBaseFrameIntervalMs() / speed));

  const alignTimelineToFrame = (frameIndex: number): void => {
    timelineStartRef.current = performance.now() - frameIndex * getFrameIntervalMs();
  };

  /**
   * Effect: Initialize playback when file loads
   * Sets frame to 0 to start playback
   */
  useEffect(() => {
    if (file.width && file.height && file.frames) {
      frameCacheRef.current.clear();
      setFrame(0);
      setIsPlaying(true);
      alignTimelineToFrame(0);
    } else {
      frameCacheRef.current.clear();
      setFrame(null);
      setIsPlaying(false);
      timelineStartRef.current = null;
    }
  }, [file.width, file.height, file.frames, file.name]);

  /**
   * Effect: Render current frame to canvas
   */
  useEffect(() => {
    if (frame === null || !file.width || !file.height || !file.frames || !file.format) {
      return;
    }

    if (frame === 0) {
      console.log('[Player] Starting playback loop', {
        name: file.name,
        frames: file.frames,
        width: file.width,
        height: file.height,
        bytes: 'streamed per frame',
      });
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reuse ImageData buffer across frames to reduce allocations.
    if (
      !imageDataRef.current ||
      imageDataRef.current.width !== file.width ||
      imageDataRef.current.height !== file.height
    ) {
      imageDataRef.current = ctx.createImageData(file.width, file.height);
    }
    const imageData = imageDataRef.current;

    // Calculate expected frame payload size.
    const numberOfPixels = file.width * file.height;
    const expectedBytesPerFrame = numberOfPixels * 3;

    let disposed = false;
    const { redOffset, greenOffset, blueOffset } = getColorOffsets;

    (async () => {
      try {
        const frameData = await getFrameData(frame);
        if (disposed) return;

        if (frameData.length !== expectedBytesPerFrame) {
          console.error('[Player] Unexpected frame payload size', {
            frame,
            received: frameData.length,
            expected: expectedBytesPerFrame,
          });
          return;
        }

        // Concurrent prefetch: next 3 frames
        if (file.frames && file.frames > 1) {
          for (let i = 1; i <= 3 && i < file.frames; i++) {
            const prefetchIndex = (frame + i) % file.frames;
            if (!frameCacheRef.current.has(prefetchIndex)) {
              void getFrameData(prefetchIndex).catch(() => {});
            }
          }
        }

        // Decode each pixel from fetched frame data.
        for (let i = 0; i < numberOfPixels; i++) {
          const src = i * 3;
          const dest = i * 4;
          imageData.data[dest + 0] = frameData[src + redOffset];
          imageData.data[dest + 1] = frameData[src + greenOffset];
          imageData.data[dest + 2] = frameData[src + blueOffset];
          imageData.data[dest + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);
      } catch (err) {
        console.error('[Player] Failed to fetch/decode frame', { frame, err });
      }
    })();

    // Cleanup on unmount or frame change
    return () => {
      disposed = true;
    };
  }, [
    frame,
    file.width,
    file.height,
    file.frames,
    file.format,
    file.name,
    getColorOffsets,
  ]);

  /**
   * Effect: Clock-driven scheduler for constant frame cadence.
   */
  useEffect(() => {
    if (!isPlaying || frame === null || !file.frames) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    if (timelineStartRef.current === null) {
      alignTimelineToFrame(frame);
    }

    const tick = (now: number): void => {
      if (!file.frames || timelineStartRef.current === null) return;
      const frameDuration = getFrameIntervalMs();
      const elapsed = now - timelineStartRef.current;
      const targetFrame = Math.floor(elapsed / frameDuration) % file.frames;

      setFrame(prev => (prev === targetFrame ? prev : targetFrame));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, file.frames, frame, speed]);

  // Keep playback phase stable when speed changes.
  useEffect(() => {
    if (frame !== null && file.frames) {
      alignTimelineToFrame(frame);
    }
  }, [speed]);

  /**
   * Render player canvas and preview
   * Shows both original size canvas and scaled preview
   */
  const makePlayer = (): JSX.Element | null => {
    if (frame === null || !file.width || !file.height || !file.frames) {
      return null;
    }

    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: '1px solid #d5deea',
          borderRadius: 2,
          background: 'linear-gradient(180deg, #f9fbff 0%, #f3f7ff 100%)',
        }}
      >
        <Box
          sx={{
            borderRadius: 1.5,
            border: '1px solid #dce6f5',
            p: 1,
            display: 'flex',
            justifyContent: 'center',
            background:
              'repeating-conic-gradient(#eaf0fb 0% 25%, #f7f9ff 0% 50%) 50% / 14px 14px',
          }}
        >
          {/* Render directly to the visible canvas to avoid per-frame data URL conversion. */}
          <canvas
            ref={canvasRef}
            width={file.width}
            height={file.height}
            style={{
              width: viewMode === 'fit' ? 'auto' : `${file.width}px`,
              height: viewMode === 'fit' ? 'auto' : `${file.height}px`,
              maxWidth: viewMode === 'fit' ? '100%' : 'none',
              maxHeight: viewMode === 'fit' ? '70vh' : 'none',
              imageRendering: 'pixelated',
              display: 'block',
              borderRadius: '4px',
            }}
          />
        </Box>
      </Paper>
    );
  };

  const makeStatus = (): JSX.Element | null => {
    const hasData = file.width && file.height && file.frames;
    const hasWidth = !!file.width;
    const hasHeight = !!file.height;
    const hasFrames = !!file.frames;

    if (hasData && hasWidth && hasHeight && hasFrames && frame !== null) {
      return null;
    }

    return (
      <Box sx={{ p: 1.5, border: '1px solid #d5deea', borderRadius: 1.5, backgroundColor: '#f8faff' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#2d3f5f', mb: 0.6 }}>
          Player not ready
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#445a7d' }}>
          {`name: ${file.name || 'n/a'} | streamed-data: ${hasData ? 'yes' : 'no'} | frames: ${file.frames ?? 'n/a'} | width: ${file.width ?? 'n/a'} | height: ${file.height ?? 'n/a'} | frameState: ${frame === null ? 'null' : frame}`}
        </Typography>
      </Box>
    );
  };

  const goToPrevFrame = (): void => {
    if (frame === null || !file.frames) return;
    const next = frame - 1 < 0 ? file.frames - 1 : frame - 1;
    setFrame(next);
    alignTimelineToFrame(next);
  };

  const goToNextFrame = (): void => {
    if (frame === null || !file.frames) return;
    const next = frame + 1 >= file.frames ? 0 : frame + 1;
    setFrame(next);
    alignTimelineToFrame(next);
  };

  return (
    <Box sx={{ display: 'grid', gap: 1.2 }}>
      {file.width && file.height && file.frames && frame !== null && (
        (() => {
          const frameDigits = Math.max(1, String(file.frames).length);
          const currentFrameLabel = String(frame + 1).padStart(frameDigits, '0');
          const totalFrameLabel = String(file.frames).padStart(frameDigits, '0');

          return (
        <Paper
          elevation={0}
          sx={{
            p: 1.2,
            border: '1px solid #d5deea',
            borderRadius: 2,
            background: '#ffffff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#1e2f4d' }}>
              {file.name}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: '#4f6488',
                fontVariantNumeric: 'tabular-nums',
                fontFamily: 'IBM Plex Mono, Consolas, monospace',
              }}
            >
              {`Frame ${currentFrameLabel}/${totalFrameLabel}`}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#4f6488' }}>{`Res ${file.width}x${file.height}`}</Typography>
            <Typography sx={{ fontSize: 12, color: '#4f6488' }}>{`Format ${file.format?.toUpperCase()}`}</Typography>

            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <IconButton size="small" onClick={goToPrevFrame} aria-label="Previous frame">
                <SkipPreviousIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => {
                  setIsPlaying(p => {
                    const next = !p;
                    if (next && frame !== null) {
                      alignTimelineToFrame(frame);
                    }
                    return next;
                  });
                }}
                aria-label={isPlaying ? 'Pause playback' : 'Play playback'}
              >
                {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
              </IconButton>
              <IconButton size="small" onClick={goToNextFrame} aria-label="Next frame">
                <SkipNextIcon fontSize="small" />
              </IconButton>

              <IconButton
                size="small"
                onClick={() => setViewMode(mode => (mode === 'fit' ? 'actual' : 'fit'))}
                aria-label={viewMode === 'fit' ? 'Switch to actual size' : 'Switch to fit view'}
              >
                {viewMode === 'fit' ? <CropFreeIcon fontSize="small" /> : <FitScreenIcon fontSize="small" />}
              </IconButton>

              <FormControl size="small" sx={{ minWidth: 96 }}>
                <InputLabel id="player-speed-label">Speed</InputLabel>
                <Select
                  labelId="player-speed-label"
                  value={String(speed)}
                  label="Speed"
                  onChange={(e) => setSpeed(Number(e.target.value))}
                >
                  <MenuItem value={'0.5'}>0.5x</MenuItem>
                  <MenuItem value={'1'}>1x</MenuItem>
                  <MenuItem value={'1.5'}>1.5x</MenuItem>
                  <MenuItem value={'2'}>2x</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Paper>
          );
        })()
      )}

      {makeStatus()}
      {/* Player canvas */}
      {makePlayer()}
    </Box>
  );
}
