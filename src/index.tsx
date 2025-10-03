/**
 * Application Entry Point
 * 
 * This file initializes the React application and renders it to the DOM.
 * It creates the root React element and mounts the App component.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Get the root DOM element where React will mount
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Create the React root and render the app
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
