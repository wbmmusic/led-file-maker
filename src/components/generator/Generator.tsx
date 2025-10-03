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
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Modal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

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
export default function Generator(_props: GeneratorProps): JSX.Element {
  // State management
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [exportModal, setExportModal] = useState<ExportModalState>(defaultExportModal);
  const [format, setFormat] = useState<ColorFormat>('rgb');
  const [errorModal, setErrorModal] = useState<ErrorModalState>(defaultErrorModal);
  const [imageOptions, setImageOptions] = useState<ImageOptionsType | null>(null);
  const [loadingModal, setLoadingModal] = useState<boolean>(false);

  /**
   * Handle export modal close
   * Called when export completes or is canceled
   */
  const handleCloseExport = (_data?: any): void => {
    console.log('Export completed');
    setExportModal(defaultExportModal);
  };

  /**
   * Check if export button should be disabled
   * @returns true if no files loaded, false otherwise
   */
  const isDisabled = (): boolean => {
    return files.length === 0;
  };

  /**
   * Handle export button click
   * Opens file save dialog and shows export modal
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
   * Render clear images button if files are loaded
   * @returns Clear button or null
   */
  const makeClearImages = (): JSX.Element | null => {
    if (files.length > 0) {
      return (
        <Button
          color="error"
          size="small"
          onClick={() => {
            window.k
              .invoke('clearImages')
              .then(res => setFiles(res))
              .catch(err => console.error('Error clearing images:', err));
          }}
        >
          Clear Images
        </Button>
      );
    }
    return null;
  };

  /**
   * Render loaded images grid
   * Shows thumbnail previews of all loaded images
   */
  const ImagesBox = (): JSX.Element => (
    <div
      style={{
        height: '200px',
        border: '1px solid lightgrey',
        overflowY: 'auto',
        fontSize: '10px',
        padding: '5px',
      }}
    >
      {(() => {
        console.log('[Generator] Rendering', files.length, 'files');
        console.log('[Generator] First file:', files[0]);
        return files.map((file, idx) => {
          if (idx === 0) {
            console.log('[Generator] Rendering first image with src:', `atom://${file.name}`);
          }
          return (
            <div
              key={`fileBox${idx}`}
            style={{
              display: 'inline-block',
              padding: '4px',
              margin: '2px',
              backgroundColor: 'lightgrey',
              maxWidth: '100px',
              minWidth: '100px',
            }}
          >
            {file.name}
            <div>
              {/* Use custom atom:// protocol to load local images */}
              <img
                style={{ maxWidth: '100%', maxHeight: '100%' }}
                src={`atom://${file.name}`}
                alt={file.name}
              />
            </div>
          </div>
          );
        });
      })()}
    </div>
  );

  /**
   * Render format selection dropdown
   * Allows selection of RGB channel order for LED hardware
   */
  const FormatSelect = (): JSX.Element => (
    <div style={{ marginTop: '6px', display: 'inline-block' }}>
      <div
        style={{
          paddingTop: '5px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Output type selector (currently only WBM Animation supported) */}
        <Box sx={{ width: 170 }}>
          <FormControl fullWidth>
            <InputLabel id="output-type-label">Output Type</InputLabel>
            <Select
              size="small"
              labelId="output-type-label"
              id="output-type-select"
              value={10}
              label="Output Type"
              onChange={e => console.log(e.target.value)}
            >
              <MenuItem value={10}>WBM Animation</MenuItem>
              <MenuItem value={20}>Other</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {/* Color format selector */}
        <Box sx={{ width: 90, marginLeft: '10px' }}>
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
      </div>
    </div>
  );

  /**
   * Render export section with preview and options
   * Only shown when files are loaded
   */
  const makeExportSection = (): JSX.Element | null => {
    if (files.length > 0) {
      return (
        <div>
          {/* Animated preview of the image sequence */}
          <Preview
            imageOptions={imageOptions}
            pause={exportModal.show}
            style={{ width: '40px', height: '1px' }}
            files={files}
          />
          <Divider style={{ marginTop: '6px', marginBottom: '6px' }} />
          {/* Thumbnail grid of all images */}
          <ImagesBox />
          <Divider style={{ marginTop: '6px', marginBottom: '6px' }} />
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-around',
            }}
          >
            {/* LED matrix configuration options */}
            <ImageOptions setOptions={options => setImageOptions(options)} />
            {/* Color format selection */}
            <FormatSelect />
            {/* Export button */}
            <div style={{ marginTop: '6px' }}>
              <Button
                disabled={isDisabled()}
                onClick={handleExport}
                size="small"
                variant="contained"
              >
                Export
              </Button>
            </div>
          </div>
          <Divider style={{ marginTop: '6px', marginBottom: '6px' }} />
        </div>
      );
    }
    return null;
  };

  /**
   * Render error modal
   * Shows when images in folder have mismatched dimensions or formats
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

  /**
   * Render folder selection and clear buttons
   */
  const SelectFolderClearButtons = (): JSX.Element => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Button
        size="small"
        component="label"
        onClick={async () => {
          setLoadingModal(true);
          window.k
            .invoke('chooseFolder')
            .then(res => {
              if (res !== 'canceled') {
                setFiles(res);
              }
              setLoadingModal(false);
            })
            .catch(err => {
              // Parse error message from main process
              const errorStr = err.toString();
              const jsonStart = errorStr.indexOf('{');
              if (jsonStart !== -1) {
                try {
                  const error = JSON.parse(errorStr.substring(jsonStart));
                  console.error('Folder load error:', error);
                  setLoadingModal(false);
                  setErrorModal({
                    show: true,
                    message: error.msg,
                    data: error.data,
                  });
                } catch (parseErr) {
                  console.error('Error parsing error message:', parseErr);
                  setLoadingModal(false);
                }
              } else {
                console.error('Folder load error:', err);
                setLoadingModal(false);
              }
            });
        }}
      >
        Select Folder Of Images
      </Button>
      {makeClearImages()}
    </div>
  );

  return (
    <div>
      {/* Main controls */}
      <SelectFolderClearButtons />
      {/* Export section (only shown when files loaded) */}
      {makeExportSection()}
      
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
      
      {/* Loading modal */}
      <Modal
        open={loadingModal}
        aria-labelledby="loading-modal-title"
        aria-describedby="loading-modal-description"
      >
        <Box sx={style} component={Paper}>
          <Typography id="loading-modal-title" variant="h6" component="h2">
            Loading...
          </Typography>
          <CircularProgress />
        </Box>
      </Modal>
      
      {/* Error modal */}
      {makeErrorModal()}
    </div>
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
