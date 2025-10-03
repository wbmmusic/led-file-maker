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
import { TabContext, TabList, TabPanel } from '@mui/lab';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Tab from '@mui/material/Tab';
import Updates from './Updates';
import Generator from './generator/Generator';
import Player from './player/Player';
import { TopProps } from '../types';

/**
 * Top-level navigation component with tabbed interface
 * @returns The rendered navigation and content area
 */
export default function Top(_props: TopProps): JSX.Element {
  // Current active tab ('generator' or 'player')
  const [tab, setTab] = useState<string>('generator');

  /**
   * Handle tab change events
   * @param _e - React event object (unused)
   * @param newValue - The new tab value
   */
  const handleChange = (_e: React.SyntheticEvent, newValue: string): void => {
    setTab(newValue);
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
      }}
    >
      <Divider />
      <TabContext value={tab}>
        <Box>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="Generator" value="generator" />
            <Tab label="Player" value="player" />
          </TabList>
        </Box>
        <Divider />
        <TabPanel
          style={{ height: '100%', overflowY: 'auto' }}
          value="generator"
        >
          <Generator />
        </TabPanel>
        <TabPanel style={{ height: '100%', overflowY: 'auto' }} value="player">
          <Player />
        </TabPanel>
      </TabContext>
      {/* Auto-update notifications */}
      <Updates />
    </Box>
  );
}
