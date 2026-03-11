/**
 * Top Component
 * 
 * Main navigation and layout component that provides tabbed interface
 * for switching between Generator and Player modes.
 * 
 * - Generator: Create LED animation files from image sequences
 * - Player: Preview and play back LED animation files
 */

import React, { useState } from 'react';
import { TabContext, TabPanel } from '@mui/lab';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Updates from './Updates';
import Generator from './generator/Generator';
import Player from './player/Player';
import { TopProps, FileInfo, WbmAniFile, ColorFormat } from '../types';

/**
 * Top-level navigation component with unified toolbar
 * @returns The rendered navigation and content area
 */
export default function Top(_props: TopProps): JSX.Element {
  // Current active tab ('generator' or 'player')
  const [tab, setTab] = useState<string>('generator');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [playerFile, setPlayerFile] = useState<Partial<WbmAniFile> | null>(null);
  const [playerLoad, setPlayerLoad] = useState<{
    loading: boolean;
    progress: number;
    label: string;
  }>({ loading: false, progress: 0, label: '' });

  /**
   * Handle folder selection (Generator mode)
   */
  const handleSelectFolder = async (): Promise<void> => {
    try {
      const res = await window.k.invoke('chooseFolder');
      if (res !== 'canceled') {
        setFiles(res);
      }
    } catch (err) {
      // Parse error message from main process
      const errorStr = (err instanceof Error ? err.message : String(err));
      const jsonStart = errorStr.indexOf('{');
      if (jsonStart !== -1) {
        try {
          const error = JSON.parse(errorStr.substring(jsonStart));
          console.error('Folder load error:', error);
        } catch (parseErr) {
          console.error('Error parsing error message:', parseErr);
        }
      } else {
        console.error('Folder load error:', err);
      }
    }
  };

  /**
   * Handle clear images (Generator mode)
   */
  const handleClearImages = async (): Promise<void> => {
    try {
      const res = await window.k.invoke('clearImages');
      setFiles(res);
    } catch (err) {
      console.error('Error clearing images:', err);
    }
  };

  /**
   * Handle opening player file
   */
  const handleOpenPlayerFile = async (): Promise<void> => {
    if (playerLoad.loading) {
      return;
    }

    try {
      setPlayerLoad({ loading: true, progress: 2, label: 'Opening file picker...' });

      window.k.receive('openAniProgress', (payload: { phase: string; loaded: number; total: number; percent: number }) => {
        if (payload.phase === 'start' || payload.phase === 'reading') {
          setPlayerLoad({
            loading: true,
            progress: payload.percent,
            label: `Reading .wbmani... ${payload.loaded}/${payload.total} bytes`,
          });
          return;
        }

        if (payload.phase === 'done') {
          setPlayerLoad({ loading: true, progress: 100, label: 'Read complete' });
          return;
        }

        if (payload.phase === 'error') {
          setPlayerLoad({ loading: false, progress: 0, label: '' });
        }
      });

      console.log('[Player/Parse] Requesting .wbmani file via IPC');
      const res = await window.k.invoke('openAniFile');

      if (res !== 'canceled') {
        console.log('[Player/Parse] Received metadata payload', res);
        setPlayerFile({
          name: res.name,
          frames: res.frames,
          width: res.width,
          height: res.height,
          format: res.format as ColorFormat,
        });
        setPlayerLoad({ loading: true, progress: 100, label: 'Ready' });
        setTimeout(() => setPlayerLoad({ loading: false, progress: 0, label: '' }), 250);
        console.log('[Player/Parse] Player state updated successfully');
      } else {
        setPlayerLoad({ loading: false, progress: 0, label: '' });
        console.log('[Player/Parse] User canceled file selection');
      }

      window.k.removeListener('openAniProgress');
    } catch (err) {
      setPlayerLoad({ loading: false, progress: 0, label: '' });
      window.k.removeListener('openAniProgress');
      console.error('[Player/Parse] Failed while opening/parsing .wbmani file:', err);
    }
  };

  /**
   * Handle clear player file
   */
  const handleClearPlayerFile = (): void => {
    setPlayerFile(null);
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        typography: 'body1',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #eef3fb 0%, #f8faff 100%)',
      }}
    >
      {/* Unified toolbar */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: '1px solid #d5deea',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          height: 44,
        }}
      >
        {/* Generator button */}
        <Tooltip title="Generator Mode">
          <IconButton
            onClick={() => setTab('generator')}
            size="small"
            sx={{
              px: 1.2,
              py: 0.8,
              borderRadius: 1,
              backgroundColor: tab === 'generator' ? '#e3f2fd' : 'transparent',
              color: tab === 'generator' ? '#0f62bb' : '#666',
              border: tab === 'generator' ? '1px solid #0f62bb' : '1px solid transparent',
              fontWeight: tab === 'generator' ? 700 : 500,
              fontSize: 11,
              '&:hover': { backgroundColor: tab === 'generator' ? '#e3f2fd' : '#f5f5f5' },
            }}
          >
            ⚙️ GEN
          </IconButton>
        </Tooltip>

        {/* Player button */}
        <Tooltip title="Player Mode">
          <IconButton
            onClick={() => setTab('player')}
            size="small"
            sx={{
              px: 1.2,
              py: 0.8,
              borderRadius: 1,
              backgroundColor: tab === 'player' ? '#e3f2fd' : 'transparent',
              color: tab === 'player' ? '#0f62bb' : '#666',
              border: tab === 'player' ? '1px solid #0f62bb' : '1px solid transparent',
              fontWeight: tab === 'player' ? 700 : 500,
              fontSize: 11,
              '&:hover': { backgroundColor: tab === 'player' ? '#e3f2fd' : '#f5f5f5' },
            }}
          >
            ▶️ PLAY
          </IconButton>
        </Tooltip>

        {/* Divider */}
        <Box sx={{ width: 1, height: 24, borderRight: '1px solid #e0e0e0', mx: 0.5 }} />

        {/* Select Folder button (only in Generator mode) */}
        {tab === 'generator' && (
          <Tooltip title="Select Folder of Images">
            <IconButton
              onClick={handleSelectFolder}
              size="small"
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                color: '#0f62bb',
                '&:hover': { backgroundColor: '#f0f7ff' },
              }}
            >
              📁
            </IconButton>
          </Tooltip>
        )}

        {/* Clear Images button (only in Generator mode, only if files loaded) */}
        {tab === 'generator' && files.length > 0 && (
          <Tooltip title="Clear Images">
            <IconButton
              onClick={handleClearImages}
              size="small"
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                color: '#d32f2f',
                '&:hover': { backgroundColor: '#ffebee' },
              }}
            >
              ✕
            </IconButton>
          </Tooltip>
        )}

        {/* Open File button (only in Player mode) */}
        {tab === 'player' && (
          <Tooltip title="Open Animation File">
            <IconButton
              onClick={handleOpenPlayerFile}
              disabled={playerLoad.loading}
              size="small"
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                color: '#0f62bb',
                '&:hover': { backgroundColor: '#f0f7ff' },
              }}
            >
              📂
            </IconButton>
          </Tooltip>
        )}

        {/* Clear File button (only in Player mode, only if file loaded) */}
        {tab === 'player' && playerFile && (
          <Tooltip title="Clear File">
            <IconButton
              onClick={handleClearPlayerFile}
              size="small"
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                color: '#d32f2f',
                '&:hover': { backgroundColor: '#ffebee' },
              }}
            >
              ✕
            </IconButton>
          </Tooltip>
        )}

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Frame counter (only in Generator mode, only if files loaded) */}
        {tab === 'generator' && files.length > 0 && (
          <Typography sx={{ fontSize: 13, color: '#445a7d', fontWeight: 600 }}>
            {files.length} frames
          </Typography>
        )}

        {tab === 'player' && playerLoad.loading && (
          <Typography sx={{ fontSize: 12, color: '#445a7d', fontWeight: 600 }}>
            {playerLoad.label} {playerLoad.progress}%
          </Typography>
        )}
      </Box>

      {tab === 'player' && playerLoad.loading && (
        <LinearProgress
          variant="determinate"
          value={playerLoad.progress}
          sx={{ height: 3, backgroundColor: '#e5edf7' }}
        />
      )}

      {/* Content area */}
      <TabContext value={tab}>
        <TabPanel
          style={{ height: '100%', overflowY: 'auto', padding: '10px 12px 14px', flex: 1 }}
          value="generator"
        >
          <Generator files={files} setFiles={setFiles} />
        </TabPanel>
        <TabPanel style={{ height: '100%', overflowY: 'auto', padding: '10px 12px 14px', flex: 1 }} value="player">
          <Player file={playerFile} onClear={handleClearPlayerFile} />
        </TabPanel>
      </TabContext>

      {/* Auto-update notifications */}
      <Updates />
    </Box>
  );
}
