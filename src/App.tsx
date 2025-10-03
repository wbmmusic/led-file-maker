/**
 * App Component
 * 
 * Root component of the application that renders the main interface.
 * This is a simple wrapper that delegates to the Top component.
 */

import React from 'react';
import Top from './components/Top';

/**
 * Main application component
 * @returns The rendered application
 */
function App(): JSX.Element {
  return <Top />;
}

export default App;
