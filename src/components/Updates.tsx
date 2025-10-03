/**
 * Updates Component
 * 
 * Manages auto-update functionality for the Electron application.
 * Displays snackbar notifications for:
 * - Download progress when an update is being downloaded
 * - Installation prompts when an update is ready
 * 
 * Uses electron-updater to check for and download updates.
 */

import React, { Fragment, useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import { UpdatesProps, DownloadSnackState, InstallSnackState } from '../types';

// Default states for snackbar notifications
const defaultDownloadSnack: DownloadSnackState = { show: false, progress: 0 };
const defaultInstallSnack: InstallSnackState = { show: false, version: 'x.x.x' };

/**
 * Auto-update notification component
 * Listens for update events from the main process and displays appropriate notifications
 * 
 * @returns The rendered update notification snackbars
 */
export default function Updates(_props: UpdatesProps): JSX.Element {
  const [downloadSnack, setDownloadSnack] = useState<DownloadSnackState>(defaultDownloadSnack);
  const [installSnack, setInstallSnack] = useState<InstallSnackState>(defaultInstallSnack);

  /**
   * Handle closing the download progress snackbar
   * @param _event - React event object (unused)
   * @param reason - Why the snackbar is closing
   */
  const handleClose = (_event: any, reason?: string): void => {
    if (reason === 'clickaway') return;
    setDownloadSnack({ show: false, progress: 0 });
  };

  /**
   * Trigger installation of the downloaded update
   * Sends IPC message to main process to quit and install
   */
  const install = (): void => {
    window.k.send('installUpdate');
  };

  /**
   * Close the installation notification snackbar
   */
  const closeInstallSnack = (): void => {
    setInstallSnack(old => ({ ...old, show: false }));
  };

  // Close button for download progress snackbar
  const action = (
    <Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Fragment>
  );

  // Action buttons for installation snackbar
  const installAction = (
    <Fragment>
      <Button color="error" size="small" onClick={() => install()}>
        Relaunch App
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={closeInstallSnack}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Fragment>
  );

  useEffect(() => {
    // Notify main process that React is ready
    window.k.send('reactIsReady');

    /**
     * Listen for updater events from main process
     * Handles all auto-updater lifecycle events:
     * - checking-for-update: Initial check started
     * - update-available: New version found, downloading
     * - update-not-available: Already on latest version
     * - download-progress: Download in progress (shows percentage)
     * - update-downloaded: Download complete, ready to install
     * - error: Update process error
     */
    window.k.receive('updater', (event, info) => {
      if (event === 'checking-for-update') {
        console.log('Checking for updates...');
      } else if (event === 'update-not-available') {
        console.log('Up to date: v' + (info && 'version' in info ? info.version : 'unknown'));
      } else if (event === 'update-available') {
        // Show download progress notification
        setDownloadSnack({ show: true, progress: 0 });
      } else if (event === 'download-progress') {
        // Update download progress percentage
        console.log('Downloading:', Math.round(info && 'percent' in info ? info.percent : 0) + '%');
        setDownloadSnack(old => ({ ...old, progress: Math.round(info && 'percent' in info ? info.percent : 0) }));
      } else if (event === 'update-downloaded') {
        // Download complete - show install prompt
        console.log('Downloaded update:', info);
        setDownloadSnack(defaultDownloadSnack);
        setInstallSnack({ show: true, version: (info && 'tag' in info && info.tag ? info.tag : info && 'version' in info && info.version ? info.version : 'new version') });
      } else if (event === 'error') {
        console.error('Update error:', info);
      } else {
        console.log('Update event:', event, info);
      }
    });

    /**
     * Receive app version from main process
     * Updates the window title with the version number
     */
    window.k.receive('app_version', (version) => {
      window.k.removeListener('app_version');
      document.title = 'LED File Maker --- v' + version;
    });

    // Cleanup listeners on unmount
    return () => {
      window.k.removeListener('updater');
    };
  }, []);

  return (
    <div>
      {/* Download progress notification */}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={downloadSnack.show}
        autoHideDuration={30000}
        onClose={handleClose}
        message={`Downloading Update ${downloadSnack.progress}%`}
        action={action}
      />
      {/* Installation ready notification */}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={installSnack.show}
        autoHideDuration={30000}
        onClose={handleClose}
        message={`Relaunch to install ${installSnack.version}`}
        action={installAction}
      />
    </div>
  );
}
