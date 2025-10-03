# WBM Animation File Format (.wbmani) Specification

## Overview

The `.wbmani` format is a custom binary file format designed for storing LED matrix animation sequences. It provides an efficient way to store pre-processed RGB image sequences with configurable pixel ordering to match various LED hardware configurations.

**Version:** 1.0  
**Extension:** `.wbmani`  
**MIME Type:** `application/x-wbmani`  
**Endianness:** Big-endian for multi-byte values

---

## File Structure

A `.wbmani` file consists of two main parts:

1. **Header** (9 bytes): Metadata about the animation
2. **Frame Data** (variable length): Raw RGB pixel data for all frames

```
┌─────────────────────────────────────┐
│         Header (9 bytes)             │
├─────────────────────────────────────┤
│      Frame 0 Pixel Data             │
├─────────────────────────────────────┤
│      Frame 1 Pixel Data             │
├─────────────────────────────────────┤
│             ...                      │
├─────────────────────────────────────┤
│      Frame N-1 Pixel Data           │
└─────────────────────────────────────┘
```

---

## Header Format

The header is exactly **9 bytes** and contains the following information:

| Byte Offset | Size (bytes) | Type       | Description                                    |
|-------------|--------------|------------|------------------------------------------------|
| 0-1         | 2            | uint16_be  | Frame count (total number of frames)           |
| 2-3         | 2            | uint16_be  | Width (pixels per row)                         |
| 4-5         | 2            | uint16_be  | Height (pixels per column)                     |
| 6-8         | 3            | ASCII      | Color format (3 characters, e.g., "rgb")       |

### Header Field Details

#### Frame Count (Bytes 0-1)
- **Type:** 16-bit unsigned integer (big-endian)
- **Range:** 1 to 65,535 frames
- **Description:** Total number of animation frames in the file

#### Width (Bytes 2-3)
- **Type:** 16-bit unsigned integer (big-endian)
- **Range:** 1 to 65,535 pixels
- **Description:** Width of each frame in pixels

#### Height (Bytes 4-5)
- **Type:** 16-bit unsigned integer (big-endian)
- **Range:** 1 to 65,535 pixels
- **Description:** Height of each frame in pixels

#### Color Format (Bytes 6-8)
- **Type:** 3 ASCII characters
- **Valid Values:**
  - `rgb` - Red, Green, Blue (standard)
  - `rbg` - Red, Blue, Green
  - `bgr` - Blue, Green, Red
  - `brg` - Blue, Red, Green
  - `grb` - Green, Red, Blue
  - `gbr` - Green, Blue, Red
- **Description:** Specifies the order of color channels in the pixel data

---

## Frame Data Format

Following the header, frame data is stored sequentially. Each frame contains raw RGB pixel data.

### Frame Data Layout

```
Frame Size (bytes) = Width × Height × 3
Total Frame Data Size = Frame Size × Frame Count
```

Each frame consists of:
- **Width × Height** pixels
- Each pixel: **3 bytes** (one for each color channel)
- Pixels are stored in the order specified by the LED matrix configuration

### Pixel Data

Each pixel is represented by **3 consecutive bytes** in the color format specified in the header:

```
[Channel1] [Channel2] [Channel3]
```

For example, if the format is `rgb`:
- Byte 0: Red intensity (0-255)
- Byte 1: Green intensity (0-255)
- Byte 2: Blue intensity (0-255)

If the format is `bgr`:
- Byte 0: Blue intensity (0-255)
- Byte 1: Green intensity (0-255)
- Byte 2: Red intensity (0-255)

### Pixel Ordering

Pixels within each frame are ordered to match LED matrix hardware wiring patterns. The ordering depends on:

1. **Start Corner:** Where the LED data line begins (topLeft, topRight, bottomLeft, bottomRight)
2. **Pixel Order:** How LEDs are connected (horizontal, vertical, or alternating/snake patterns)

Common ordering patterns:

- **Horizontal:** Left-to-right, row by row
- **Vertical:** Top-to-bottom, column by column
- **Horizontal Alternate (Snake):** Alternating direction per row (→ ← → ← ...)
- **Vertical Alternate (Snake):** Alternating direction per column (↓ ↑ ↓ ↑ ...)

---

## Reading a .wbmani File

### Step-by-Step Process

1. **Read Header (9 bytes)**
   ```python
   with open('animation.wbmani', 'rb') as f:
       header = f.read(9)
       
       # Parse header
       frame_count = (header[0] << 8) | header[1]
       width = (header[2] << 8) | header[3]
       height = (header[4] << 8) | header[5]
       color_format = chr(header[6]) + chr(header[7]) + chr(header[8])
   ```

2. **Calculate Frame Size**
   ```python
   pixels_per_frame = width * height
   bytes_per_frame = pixels_per_frame * 3
   ```

3. **Read Frame Data**
   ```python
   # Read all frames
   frame_data = f.read(frame_count * bytes_per_frame)
   
   # Extract individual frames
   frames = []
   for i in range(frame_count):
       start = i * bytes_per_frame
       end = start + bytes_per_frame
       frame = frame_data[start:end]
       frames.append(frame)
   ```

4. **Decode Pixels**
   ```python
   def decode_pixel(pixel_bytes, format):
       if format == 'rgb':
           return (pixel_bytes[0], pixel_bytes[1], pixel_bytes[2])
       elif format == 'bgr':
           return (pixel_bytes[2], pixel_bytes[1], pixel_bytes[0])
       # ... handle other formats
   ```

---

## Writing a .wbmani File

### Step-by-Step Process

1. **Prepare Header**
   ```python
   def write_uint16_be(value):
       high_byte = (value >> 8) & 0xFF
       low_byte = value & 0xFF
       return bytes([high_byte, low_byte])
   
   # Create header
   header = bytearray()
   header.extend(write_uint16_be(frame_count))
   header.extend(write_uint16_be(width))
   header.extend(write_uint16_be(height))
   header.extend(color_format.encode('ascii'))  # e.g., 'rgb'
   ```

2. **Process Image Frames**
   ```python
   # For each image in sequence
   for image in images:
       # Extract pixels in desired order
       pixels = extract_pixels_in_order(image, start_corner, pixel_order)
       
       # Convert to target color format
       for pixel in pixels:
           r, g, b = pixel
           if color_format == 'rgb':
               frame_data.extend([r, g, b])
           elif color_format == 'bgr':
               frame_data.extend([b, g, r])
           # ... handle other formats
   ```

3. **Write File**
   ```python
   with open('output.wbmani', 'wb') as f:
       f.write(header)
       f.write(frame_data)
   ```

---

## Example Implementation

### Python Example: Reading and Displaying

```python
import struct
from PIL import Image

def read_wbmani(filename):
    """Read a .wbmani file and return header info and frames."""
    with open(filename, 'rb') as f:
        # Read header
        header = f.read(9)
        frame_count = struct.unpack('>H', header[0:2])[0]
        width = struct.unpack('>H', header[2:4])[0]
        height = struct.unpack('>H', header[4:6])[0]
        color_format = header[6:9].decode('ascii')
        
        # Read all frame data
        bytes_per_frame = width * height * 3
        frames = []
        
        for _ in range(frame_count):
            frame_bytes = f.read(bytes_per_frame)
            frames.append(frame_bytes)
        
        return {
            'frame_count': frame_count,
            'width': width,
            'height': height,
            'format': color_format,
            'frames': frames
        }

def frame_to_image(frame_bytes, width, height, color_format):
    """Convert frame bytes to PIL Image."""
    pixels = []
    for i in range(0, len(frame_bytes), 3):
        if color_format == 'rgb':
            pixel = (frame_bytes[i], frame_bytes[i+1], frame_bytes[i+2])
        elif color_format == 'bgr':
            pixel = (frame_bytes[i+2], frame_bytes[i+1], frame_bytes[i])
        # ... handle other formats
        pixels.append(pixel)
    
    img = Image.new('RGB', (width, height))
    img.putdata(pixels)
    return img

# Usage
animation = read_wbmani('animation.wbmani')
print(f"Frames: {animation['frame_count']}")
print(f"Size: {animation['width']}x{animation['height']}")
print(f"Format: {animation['format']}")

# Display first frame
first_frame = frame_to_image(
    animation['frames'][0],
    animation['width'],
    animation['height'],
    animation['format']
)
first_frame.show()
```

### JavaScript/Node.js Example

```javascript
const fs = require('fs');

function readWbmani(filename) {
    const buffer = fs.readFileSync(filename);
    
    // Parse header
    const frameCount = buffer.readUInt16BE(0);
    const width = buffer.readUInt16BE(2);
    const height = buffer.readUInt16BE(4);
    const colorFormat = buffer.toString('ascii', 6, 9);
    
    // Extract frames
    const bytesPerFrame = width * height * 3;
    const frames = [];
    
    for (let i = 0; i < frameCount; i++) {
        const start = 9 + (i * bytesPerFrame);
        const end = start + bytesPerFrame;
        frames.push(buffer.slice(start, end));
    }
    
    return {
        frameCount,
        width,
        height,
        colorFormat,
        frames
    };
}

// Usage
const animation = readWbmani('animation.wbmani');
console.log(`Frames: ${animation.frameCount}`);
console.log(`Size: ${animation.width}x${animation.height}`);
console.log(`Format: ${animation.colorFormat}`);
```

---

## LED Matrix Integration

### Hardware Considerations

When creating `.wbmani` files for specific LED hardware, consider:

1. **LED Strip/Matrix Type:**
   - WS2812B (NeoPixel)
   - APA102 (DotStar)
   - WS2801
   - Custom controllers

2. **Physical Layout:**
   - Where does the data line connect? (start corner)
   - How are LEDs wired? (horizontal, vertical, snake pattern)
   - Is the matrix oriented differently than the image?

3. **Color Format:**
   - Different LED types expect different color orders
   - WS2812B typically uses GRB
   - APA102 typically uses BGR
   - Check your hardware datasheet

### Playback on LED Hardware

Basic playback loop (pseudocode):

```
1. Read .wbmani file
2. Parse header to get frame count and pixel configuration
3. Loop:
   a. Read next frame data
   b. Send pixel data to LED hardware
   c. Wait for frame delay (e.g., 33ms for 30fps)
   d. Repeat from step 3a (loop back to frame 0 when done)
```

---

## File Size Calculation

Calculate the expected file size:

```
File Size = Header + (Frames × Width × Height × 3)
File Size = 9 + (Frames × Width × Height × 3) bytes
```

**Examples:**

| Frames | Width | Height | File Size      |
|--------|-------|--------|----------------|
| 100    | 16    | 16     | 76,809 bytes   |
| 300    | 32    | 32     | 921,609 bytes  |
| 60     | 64    | 64     | 737,289 bytes  |

---

## Best Practices

### For File Creators

1. **Validate Dimensions:** Ensure all source images have the same dimensions
2. **Test Hardware:** Verify color format and pixel ordering with your LED hardware
3. **Optimize Frame Count:** More frames = larger files. Consider your storage and playback device
4. **Frame Rate:** 30fps (33ms per frame) is standard, but adjust based on your needs

### For File Consumers

1. **Validate Header:** Check magic bytes and dimensions are reasonable
2. **Memory Management:** Large animations may require streaming instead of loading all frames
3. **Error Handling:** Handle corrupt files gracefully
4. **Buffer Sizes:** Ensure your LED buffer matches the width × height in the file

---

## Troubleshooting

### Common Issues

**Issue: Colors are wrong**
- **Solution:** Check color format in header. Try different format values (rgb, bgr, grb, etc.)

**Issue: Image appears scrambled or in wrong order**
- **Solution:** Pixel ordering may not match LED hardware. Regenerate file with correct start corner and pixel order settings

**Issue: Animation plays too fast/slow**
- **Solution:** Adjust frame delay in your playback code. Standard is 33ms per frame (~30fps)

**Issue: File won't open**
- **Solution:** Verify file is not corrupted. Check that file size matches expected size based on header

---

## Version History

### Version 1.0 (Current)
- Initial specification
- 9-byte header format
- Support for 6 color formats (RGB permutations)
- Variable pixel ordering support

---

## License & Contact

This format specification is provided as-is for use with LED File Maker and compatible applications.

**Author:** Marece Williams (WBM Tek)  
**Email:** wbmmusic@gmail.com  
**Repository:** https://github.com/wbmmusic/led-file-maker

---

## Appendix: Color Format Reference

| Format | Byte 0 | Byte 1 | Byte 2 |
|--------|--------|--------|--------|
| rgb    | Red    | Green  | Blue   |
| rbg    | Red    | Blue   | Green  |
| bgr    | Blue   | Green  | Red    |
| brg    | Blue   | Red    | Green  |
| grb    | Green  | Red    | Blue   |
| gbr    | Green  | Blue   | Red    |

### Common LED Hardware Formats

| LED Type     | Typical Format |
|--------------|----------------|
| WS2812B      | GRB            |
| WS2811       | RGB            |
| APA102       | BGR            |
| SK6812       | GRB            |
| WS2801       | RGB            |
| TM1803       | RGB            |

**Note:** Always check your specific hardware datasheet as formats can vary by manufacturer and model.
