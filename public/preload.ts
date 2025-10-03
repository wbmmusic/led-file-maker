/**
 * Electron Preload Script
 * 
 * This script runs in a special context that has access to both Node.js APIs
 * and the renderer's DOM. It uses contextBridge to safely expose IPC methods
 * to the renderer process, providing a secure communication channel between
 * the main process and the web page.
 * 
 * Security: The contextBridge creates an isolated API that prevents the renderer
 * from directly accessing Node.js or Electron APIs, following security best practices.
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

/**
 * Expose a limited, secure API to the renderer process via window.k
 * 
 * This API provides type-safe IPC communication methods:
 * - invoke: Request-response pattern for async operations
 * - send: One-way messages to main process
 * - receive: Listen for messages from main process
 * - removeListener: Clean up event listeners
 */
contextBridge.exposeInMainWorld('k', {
  /**
   * Invoke an IPC handler and wait for response
   * Used for operations that need to return data (e.g., file dialogs, file operations)
   * 
   * @param channel - IPC channel name
   * @param args - Arguments to pass to the handler
   * @returns Promise resolving to the handler's response
   */
  invoke: (channel: string, args?: any): Promise<any> => {
    return ipcRenderer.invoke(channel, args);
  },

  /**
   * Send a one-way message to the main process
   * Used for fire-and-forget operations (e.g., notifications, status updates)
   * 
   * @param channel - IPC channel name
   * @param args - Arguments to send
   */
  send: (channel: string, args?: any): void => {
    ipcRenderer.send(channel, args);
  },

  /**
   * Register a listener for messages from the main process
   * The callback receives only the message data, not the event object (security)
   * 
   * @param channel - IPC channel name to listen on
   * @param func - Callback function invoked when message is received
   */
  receive: (channel: string, func: (...args: any[]) => void): void => {
    // Strip the event parameter for security - only pass the data
    ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args: any[]) => {
      func(...args);
    });
  },

  /**
   * Remove all listeners for a specific channel
   * Important for cleanup to prevent memory leaks
   * 
   * @param channel - IPC channel name to clean up
   */
  removeListener: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel);
  }
});
