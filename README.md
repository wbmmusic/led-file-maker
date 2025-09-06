# LED Animation File Generator

A desktop application for creating and playing LED animation files from image sequences. Converts image folders into optimized binary animation files for embedded LED projects.

## Features

### Generator
- **Image Sequence Processing**: Select folder of images and convert to LED animation format
- **Color Format Support**: Multiple RGB color orders (RGB, RBG, BGR, BRG, GRB, GBR)
- **Real-time Preview**: Live animation preview before export
- **Optimized Output**: Creates compact binary files for flash memory storage

### Player
- **Animation Playback**: Load and play generated animation files
- **30fps Rendering**: Smooth playback with canvas-based display
- **Format Detection**: Automatically reads file metadata (frames, resolution, color format)
- **Scaling Display**: Resizable preview window

## Supported LED Hardware

- LED strips (WS2812, APA102, etc.)
- LED matrices
- Discrete RGB LEDs
- Any project requiring animation data in flash memory

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm start    # Start React development server
pnpm dev      # Start with Electron
pnpm build    # Build for production
pnpm package  # Create distributable package
```

## Usage

### Creating Animations
1. Prepare image sequence (numbered files: frame001.png, frame002.png, etc.)
2. Launch application and go to Generator tab
3. Click "Select Folder Of Images"
4. Choose color format to match your LED hardware
5. Preview animation
6. Export to binary file

### Playing Animations
1. Go to Player tab
2. Click "Open File" and select generated animation file
3. Animation plays automatically at 30fps

## File Format

Generated files use a custom binary format optimized for embedded systems:
- Header: Frame count, width, height, color format
- Data: Raw RGB pixel data for each frame

## Technical Details

- Built with React + Electron
- Image processing with Sharp library
- Material-UI interface
- Cross-platform compatibility