import Tab from '@mui/material/Tab'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import React, { useState } from 'react'
import Player from './player/Player'
import Generator from './generator/Generator';

export default function Top() {
    const [tab, setTab] = useState('generator')

    const handleChange = (e, newValue) => setTab(newValue)

    return (
        <Box sx={{ width: '100vw', height: '100vh', overflow: 'hidden', typography: 'body1', display: 'flex', flexDirection: 'column' }}>
            <Divider />
            <TabContext value={tab}>
                <Box>
                    <TabList onChange={handleChange} aria-label="lab API tabs example">
                        <Tab label="Generator" value="generator" />
                        <Tab label="Player" value="player" />
                    </TabList>
                </Box>
                <Divider />
                <TabPanel style={{ height: '100%', overflowY: 'auto' }} value="generator">
                    <Generator />
                </TabPanel>
                <TabPanel style={{ height: '100%', overflowY: 'auto' }} value="player">
                    <Player />
                </TabPanel>
            </TabContext>
        </Box>
    )
}