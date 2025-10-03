/// <reference types="react-scripts" />

// Declare CSS modules
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Declare image imports
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}
