/**
 * TypeScript declarations for Electron IPC bridge exposed via contextBridge
 * This makes the `window.k` API available with full type safety in the renderer process
 */

import { IpcChannels } from './ipc';

/**
 * Type-safe IPC communication interface exposed to renderer
 */
interface ElectronAPI {
  /**
   * Invoke an IPC handler in the main process and wait for response
   * @param channel - The IPC channel name
   * @param args - Arguments to pass to the handler
   * @returns Promise resolving to the handler's response
   */
  invoke<K extends keyof IpcChannels>(
    channel: K,
    ...args: IpcChannels[K] extends { request: infer R } ? (R extends void ? [] : [R]) : []
  ): Promise<IpcChannels[K] extends { response: infer R } ? R : void>;

  /**
   * Send a one-way message to the main process (no response expected)
   * @param channel - The IPC channel name
   * @param args - Arguments to send
   */
  send<K extends keyof IpcChannels>(
    channel: K,
    args?: IpcChannels[K] extends void ? undefined : IpcChannels[K]
  ): void;

  /**
   * Register a listener for messages from the main process
   * @param channel - The IPC channel name
   * @param func - Callback function to handle received messages
   */
  receive<K extends keyof IpcChannels>(
    channel: K,
    func: IpcChannels[K] extends void 
      ? () => void 
      : IpcChannels[K] extends any[]
        ? (...args: IpcChannels[K]) => void
        : (data: IpcChannels[K]) => void
  ): void;

  /**
   * Remove all listeners for a specific channel
   * @param channel - The IPC channel name
   */
  removeListener(channel: keyof IpcChannels): void;
}

declare global {
  interface Window {
    /**
     * Electron IPC API bridge
     * Exposed via contextBridge in preload script
     */
    k: ElectronAPI;
  }
}

export {};
