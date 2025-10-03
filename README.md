# LED Animation File Generator

![TypeScript](https://img.shields.io/badge/TypeScript-5.6.0-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19.1.1-61dafb?logo=react)
![Electron](https://img.shields.io/badge/Electron-38.2.0-47848f?logo=electron)
![License](https://img.shields.io/badge/license-MIT-green)

A desktop application for creating LED animation files **pre-processed for direct DMA transfer to LED strips**. Converts image sequences into optimized binary files where pixel data is stored in the exact color format and order that your LED hardware expects - eliminating runtime processing on microcontrollers.

> **✨ Now fully migrated to TypeScript!** Complete with type safety, comprehensive documentation, and improved code quality.

## Why This Exists

LED strips (WS2812, APA102, etc.) have different color orders (RGB vs GRB vs BGR) and LED matrices have different wiring patterns (horizontal, vertical, snake, etc.). This tool pre-processes your animations so the data can be streamed directly from flash memory to LEDs via DMA with **zero runtime color conversion or pixel reordering**. Your microcontroller just reads and transmits - no CPU cycles wasted.

## Table of Contents
- [Features](#features)
- [Technical Stack](#technical-stack)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [File Format](#file-format)
- [Development](#development)
- [TypeScript Migration](#typescript-migration)
- [Contributing](#contributing)
- [License](#license)

## Features

### Generator
- **Image Sequence Processing**: Select folder of images and convert to LED animation format
- **Hardware-Specific Color Format**: Pre-process into exact color order your LED strip expects (RGB, RBG, BGR, BRG, GRB, GBR)
- **Hardware-Specific Pixel Ordering**: Pre-arrange pixels to match your LED matrix wiring (horizontal, vertical, snake patterns, any start corner)
- **Real-time Preview**: Live animation preview before export
- **DMA-Ready Output**: Creates binary files structured for direct flash-to-LED streaming via DMA

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

## Quick Start

```bash
# Clone the repository
git clone https://github.com/wbmmusic/led-file-maker.git
cd led-file-maker

# Install dependencies
pnpm install

# Run in development mode
pnpm dev
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

Generated files use the `.wbmani` binary format optimized for zero-copy DMA streaming:
- **Header (9 bytes)**: Frame count, width, height, color format
- **Frame Data**: Pixels pre-ordered and pre-formatted exactly as your LED hardware expects
- **Sequential Layout**: Each frame stored contiguously for efficient flash reads
- **No Processing Required**: Data can be transmitted directly to LEDs without modification

See [WBMANI_FORMAT.md](WBMANI_FORMAT.md) for complete specification including C implementation examples.

## Technical Stack

### Core Technologies
- **React 19.1.1** - Modern React with new JSX transform
- **TypeScript 5.6.0** - Full type safety with strict mode
- **Electron 38.2.0** - Desktop application framework
- **Material-UI v7** - Modern React component library

### Image Processing
- **Sharp 0.34.4** - High-performance image processing
- **image-size 2.0.2** - Fast image dimension detection

### Build Tools
- **React Scripts 5.0.1** - React build configuration
- **TypeScript Compiler** - Dual compilation (React + Electron)
- **electron-builder** - Application packaging

### Code Quality
- **Strict TypeScript** - Complete type coverage
- **JSDoc Comments** - Comprehensive function documentation
- **Inline Comments** - Detailed algorithm explanations

## Project Structure

```
led-file-maker/
├── public/
│   ├── app.ts          # Electron main process (TypeScript)
│   └── preload.ts      # Electron preload script (TypeScript)
├── src/
│   ├── components/     # React components (TypeScript)
│   │   ├── generator/  # Animation creation UI
│   │   └── player/     # Animation playback UI
│   ├── types/          # TypeScript type definitions
│   │   ├── components.ts
│   │   ├── electron.d.ts
│   │   ├── fileFormat.ts
│   │   ├── ipc.ts
│   │   └── jsx.d.ts
│   ├── App.tsx         # Main application component
│   └── index.tsx       # React entry point
├── build/              # Compiled output (gitignored)
├── WBMANI_FORMAT.md   # File format documentation
└── TYPESCRIPT_CONVERSION.md  # Migration guide
```

## Development

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Setup
```bash
# Install dependencies
pnpm install

# Development mode (hot reload)
pnpm dev

# Build TypeScript
pnpm build:electron

# Build React app
pnpm build
```

### Available Scripts
```bash
pnpm start          # Start React dev server only
pnpm dev            # Start React + Electron in development mode
pnpm build          # Full production build (Electron + React)
pnpm build:electron # Compile TypeScript (Electron files only)
pnpm package        # Create distributable package
pnpm deploy         # Build and publish update
```

## TypeScript Migration

This project was fully migrated from JavaScript to TypeScript in October 2025. Key improvements:

### Type Safety
- ✅ Complete type definitions for all components
- ✅ Strict null checks enabled
- ✅ No implicit `any` types
- ✅ Full IPC type safety between main and renderer

### Documentation
- ✅ JSDoc comments on all functions
- ✅ Inline comments for complex algorithms
- ✅ Protocol specification document ([WBMANI_FORMAT.md](WBMANI_FORMAT.md))
- ✅ Migration guide ([TYPESCRIPT_CONVERSION.md](TYPESCRIPT_CONVERSION.md))

### Bug Fixes During Migration
- Fixed custom protocol handler (atom://) for local image loading
- Fixed image-size library v2.x API usage
- Fixed React 19 JSX namespace compatibility
- Fixed duplicate file parameter detection

## Cross-Platform Support

The application runs on:
- ✅ Windows 10/11
- ✅ macOS 10.13+
- ✅ Linux (Ubuntu, Fedora, etc.)

## Troubleshooting

### Images Not Loading
If images show as broken after selecting a folder:
1. Ensure you're using the latest version
2. Check that all images in the folder have the same dimensions and format
3. Restart the application if needed

### Build Errors
```bash
# Clean build and reinstall
rm -rf node_modules build
pnpm install
pnpm build
```

### Protocol Handler Issues
The app uses a custom `atom://` protocol for loading images. This is properly configured in the latest version with the `standard: true` privilege.

## Practical Usage Guide

### Typical Hardware Setup

**Common Microcontrollers:**
- Arduino (SAMD11, SAMD21, SAMD51)
- ESP32/ESP8266
- STM32
- Teensy

**Storage:** SPI Flash chips (most common for embedded projects)

**Matrix Sizes:** Typically 100×100 pixels or smaller for practical memory constraints

### Understanding Pixel Ordering

Since this tool targets **addressable LED strips** (where data flows from one LED to the next), the physical wiring pattern determines how pixels should be ordered in your animation file.

**Why does this matter?**  
When you chain LED strips to form a matrix, the data signal flows in a continuous path. For example:
- **Horizontal Snake:** Data enters top-left, goes right across row 1, then continues from the right end into row 2 going left, then row 3 going right, etc.
- **Vertical Snake:** Data enters top-left, goes down column 1, then up column 2, down column 3, etc.
- **Start Corner:** Your data input can begin at any corner (top-left, top-right, bottom-left, bottom-right)

This tool pre-arranges your image pixels to match your physical LED chain order, so pixel index 0 in the file corresponds to the first LED in your chain, pixel 1 to the second LED, etc.

### Determining Your LED Color Format

Check your LED strip's **datasheet** to find the color order:
- WS2812B → GRB
- WS2811 → RGB  
- APA102 → BGR
- SK6812 → GRB

**Troubleshooting:** If your colors look wrong (e.g., red appears as green), you likely have the wrong color format selected. Try the other formats until colors display correctly.

### Playback Frame Rate

The player runs at **30fps by default**, but this is easily adjustable in your embedded code. Your microcontroller can play animations at any frame rate depending on your timing requirements and LED refresh constraints.

### Double Buffering Recommendation

For smooth playback, use **double buffering**:
1. Buffer A holds the current frame being transmitted via DMA to LEDs
2. Buffer B is being filled via DMA read from flash with the next frame
3. Swap buffers when current frame transmission completes
4. Repeat

This ensures continuous playback without frame drops or stuttering.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode conventions
- Add JSDoc comments to all public functions
- Include inline comments for complex logic
- Update type definitions as needed
- Test thoroughly before submitting PR

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Marece Williams**
- Website: [marecewilliams.com](https://www.marecewilliams.com)
- Email: wbmmusic@gmail.com
- GitHub: [@wbmmusic](https://github.com/wbmmusic)

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI powered by [Material-UI](https://mui.com/)
- Image processing by [Sharp](https://sharp.pixelplumbing.com/)
- TypeScript migration completed October 2025

---

**⭐ Star this repo if you find it useful!**