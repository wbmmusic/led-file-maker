/**
 * JSX Namespace Declaration
 * 
 * This file provides the JSX namespace for TypeScript when using React 19
 * with the new JSX transform (react-jsx). It aliases React's JSX namespace
 * to the global JSX namespace for backward compatibility with code that
 * uses `JSX.Element` return types.
 */

import 'react';

declare global {
  namespace JSX {
    interface Element extends React.JSX.Element {}
    interface ElementClass extends React.JSX.ElementClass {}
    interface ElementAttributesProperty extends React.JSX.ElementAttributesProperty {}
    interface ElementChildrenAttribute extends React.JSX.ElementChildrenAttribute {}
    interface IntrinsicAttributes extends React.JSX.IntrinsicAttributes {}
    interface IntrinsicClassAttributes<T> extends React.JSX.IntrinsicClassAttributes<T> {}
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }
}
