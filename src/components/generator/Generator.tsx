/**
 * Generator Component
 * 
 * Main component for creating LED animation files from image sequences.
 * 
 * Workflow:
 * 1. User selects a folder containing image sequence
 * 2. Images are validated (must all be same dimensions and format)
 * 3. User configures export settings:
 *    - Color format (RGB, BGR, GRB, etc.)
 *    - LED matrix configuration (start corner, pixel order)
 *    - Image transformations (flip horizontal/vertical)
 * 4. Preview shows animated playback with applied transformations
 * 5. Export creates binary .wbmani file optimized for LED playback
 * 
 * The export process runs in the main Electron process for better performance
 * when processing large image sequences.
 */

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Modal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import Preview from './Preview';
import Export from './Export';
import ImageOptions from './ImageOptions';
import {
  GeneratorProps,
  FileInfo,
  ExportModalState,
  ErrorModalState,
  ColorFormat,
  ImageOptions as ImageOptionsType
} from '../../types';

// Default modal states
const defaultExportModal: ExportModalState = { show: false };
const defaultErrorModal: ErrorModalState = {
  show: false,
  message: 'Default Message',
  data: [],
};

/**
 * LED animation generator interface
 * @returns The rendered generator component
 */
export default function Generator(props: GeneratorProps): JSX.Element {
  // Props
  const { files: initialFiles, setFiles } = props;

  // State management
  const [files, setLocalFiles] = useState<FileInfo[]>(initialFiles);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [exportModal, setExportModal] = useState<ExportModalState>(defaultExportModal);
  const [format, setFormat] = useState<ColorFormat>('rgb');
  const [errorModal, setErrorModal] = useState<ErrorModalState>(defaultErrorModal);
  const [imageOptions, setImageOptions] = useState<ImageOptionsType | null>(null);

  // Sync local files with props
  React.useEffect(() => {
    setLocalFiles(initialFiles);
    setCurrentFrameIndex(0);
  }, [initialFiles]);

  /**
   * Handle export modal close
   */
  const handleCloseExport = (_data?: any): void => {
    console.log('Export completed');
    setExportModal(defaultExportModal);
  };

  /**
   * Check if export button should be disabled
   */
  const isDisabled = (): boolean => {
    return files.length === 0;
  };

  /**
   * Handle export button click
   */
  const handleExport = (): void => {
    window.k
      .invoke('chooseOutput')
      .then(res => {
        if (res !== 'canceled') {
          setExportModal({ show: true, outPath: res });
        }
      })
      .catch(err => console.error('Error choosing output:', err));
  };

  /**
   * Navigate to next frame
   */
  const goToNextFrame = (): void => {
    if (currentFrameIndex < files.length - 1) {
      setCurrentFrameIndex(currentFrameIndex + 1);
    }
  };

  /**
   * Navigate to previous frame
   */
  const goToPreviousFrame = (): void => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex(currentFrameIndex - 1);
    }
  };

  /**
   * Render frame timeline controls
   */
  const FrameTimeline = (): JSX.Element | null => {
    if (files.length === 0) return null;
    
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.2,
          borderRadius: 2,
          border: '1px solid #d4dde8',
          background: '#f8faff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          {/* Previous frame button */}
          <IconButton
            size="small"
            onClick={goToPreviousFrame}
            disabled={currentFrameIndex === 0}
            sx={{ borderRadius: 1 }}
          >
            ◀
          </IconButton>

          {/* Frame counter */}
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#2d3f5f', minWidth: 80 }}>
            Frame {currentFrameIndex + 1} / {files.length}
          </Typography>

          {/* Timeline slider */}
          <Slider
            value={currentFrameIndex}
            onChange={(_, newValue) => setCurrentFrameIndex(newValue as number)}
            min={0}
            max={files.length - 1}
            step={1}
            sx={{ flex: 1, mx: 1 }}
          />

          {/* Next frame button */}
          <IconButton
            size="small"
            onClick={goToNextFrame}
            disabled={currentFrameIndex === files.length - 1}
            sx={{ borderRadius: 1 }}
          >
            ▶
          </IconButton>
        </Box>
      </Paper>
    );
  };

  /**
   * Render format selection dropdown
   */
  const FormatSelect = (): JSX.Element => (
    <Box sx={{ width: 110 }}>
      <FormControl fullWidth>
        <InputLabel id="format-label">Format</InputLabel>
        <Select
          size="small"
          labelId="format-label"
          id="format-select"
          value={format}
          label="Format"
          onChange={(e: SelectChangeEvent<ColorFormat>) => 
            setFormat(e.target.value as ColorFormat)
          }
        >
          <MenuItem value={'rgb' as ColorFormat}>RGB</MenuItem>
          <MenuItem value={'rbg' as ColorFormat}>RBG</MenuItem>
          <MenuItem value={'bgr' as ColorFormat}>BGR</MenuItem>
          <MenuItem value={'brg' as ColorFormat}>BRG</MenuItem>
          <MenuItem value={'grb' as ColorFormat}>GRB</MenuItem>
          <MenuItem value={'gbr' as ColorFormat}>GBR</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );

  /**
   * Render footer with tools and export button
   */
  const makeFooterSection = (): JSX.Element | null => {
    if (files.length > 0) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: '1px solid #d4dde8',
            background: '#f9fbff',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: 1.5,
              alignItems: 'center',
            }}
          >
            {/* LED matrix configuration options */}
            <ImageOptions setOptions={options => setImageOptions(options)} />
            
            {/* Color format selection */}
            <FormatSelect />

            {/* Export button */}
            <Button
              disabled={isDisabled()}
              onClick={handleExport}
              size="large"
              variant="contained"
              sx={{
                borderRadius: 1.5,
                px: 3,
                background: 'linear-gradient(135deg, #1976d2 0%, #0f59a9 100%)',
              }}
            >
              Export
            </Button>
          </Box>
        </Paper>
      );
    }
    return null;
  };

  /**
   * Render error modal
   */
  const makeErrorModal = (): JSX.Element | null => {
    if (errorModal.show === true) {
      return (
        <Modal
          open={errorModal.show}
          aria-labelledby="error-modal-title"
          aria-describedby="error-modal-description"
        >
          <Box sx={style} component={Paper}>
            <Typography id="error-modal-title" variant="h6" component="h2">
              ERROR
            </Typography>
            <Typography id="error-modal-description" sx={{ mt: 2 }}>
              {errorModal.message}
            </Typography>
            {/* Table showing conflicting file types/dimensions */}
            <div style={{ display: 'inline-block' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Width</TableCell>
                    <TableCell>Height</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errorModal.data.map((thing, idx) => (
                    <TableRow key={`errorItem${idx}`}>
                      <TableCell>{thing.type}</TableCell>
                      <TableCell>{thing.width}px</TableCell>
                      <TableCell>{thing.height}px</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Button onClick={() => setErrorModal(defaultErrorModal)}>
                Close
              </Button>
            </div>
          </Box>
        </Modal>
      );
    }
    return null;
  };

  return (
    <Box sx={{ p: 1.2, display: 'grid', gap: 1.2, gridTemplateRows: 'auto 1fr auto auto' }}>
      {/* Frame timeline (only shown when files loaded) */}
      <FrameTimeline />

      {/* Hero preview (grows to fill space) */}
      {files.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 2,
            border: '1px solid #d4dde8',
            background: 'linear-gradient(135deg, #f9fbff 0%, #eef3fb 100%)',
            p: 1.5,
            minHeight: 300,
            overflow: 'hidden',
          }}
        >
          <Preview
            imageOptions={imageOptions}
            pause={exportModal.show}
            style={{ width: '40px', height: '1px' }}
            files={files}
          />
        </Box>
      )}

      {/* Footer: Tools and export */}
      {makeFooterSection()}
      
      {/* Export progress modal */}
      <Modal
        open={exportModal.show}
        aria-labelledby="export-modal-title"
        aria-describedby="export-modal-description"
      >
        <Box sx={style} component={Paper}>
          <Typography id="export-modal-title" variant="h6" component="h2">
            Exporting...
          </Typography>
          {exportModal.outPath && imageOptions && (
            <Export
              imageOptions={imageOptions}
              format={format}
              path={exportModal.outPath}
              totalFrames={files.length}
              close={handleCloseExport}
            />
          )}
          <div style={{ textAlign: 'right' }}>
            <Button
              onClick={async () => {
                await window.k.invoke('cancelExport');
                setExportModal(defaultExportModal);
              }}
            >
              Cancel
            </Button>
          </div>
        </Box>
      </Modal>
      
      {/* Error modal */}
      {makeErrorModal()}
    </Box>
  );
}

// Modal styling
const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};
