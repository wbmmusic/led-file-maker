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
   ```c
   // Calculate total data size
   size_t bytes_per_frame = width * height * 3;
   size_t total_data_size = frame_count * bytes_per_frame;
   
   // Allocate memory for all frame data
   uint8_t* frame_data = (uint8_t*)malloc(total_data_size);
   fread(frame_data, 1, total_data_size, fp);
   
   // Extract individual frames
   uint8_t** frames = (uint8_t**)malloc(frame_count * sizeof(uint8_t*));
   for (int i = 0; i < frame_count; i++) {
       size_t offset = i * bytes_per_frame;
       frames[i] = &frame_data[offset];
   }
   ```

4. **Decode Pixels**
   ```c
   void decode_pixel(uint8_t* pixel_bytes, char* format, 
                     uint8_t* r, uint8_t* g, uint8_t* b) {
       if (strcmp(format, "rgb") == 0) {
           *r = pixel_bytes[0];
           *g = pixel_bytes[1];
           *b = pixel_bytes[2];
       } else if (strcmp(format, "bgr") == 0) {
           *b = pixel_bytes[0];
           *g = pixel_bytes[1];
           *r = pixel_bytes[2];
       } else if (strcmp(format, "grb") == 0) {
           *g = pixel_bytes[0];
           *r = pixel_bytes[1];
           *b = pixel_bytes[2];
       }
       // ... handle other formats
   }
   ```

---

## Writing a .wbmani File

### Step-by-Step Process

1. **Prepare Header**
   ```c
   void write_uint16_be(uint8_t* buffer, uint16_t value) {
       buffer[0] = (value >> 8) & 0xFF;  // High byte
       buffer[1] = value & 0xFF;          // Low byte
   }
   
   // Create header (9 bytes)
   uint8_t header[9];
   write_uint16_be(&header[0], frame_count);
   write_uint16_be(&header[2], width);
   write_uint16_be(&header[4], height);
   memcpy(&header[6], color_format, 3);  // e.g., "rgb"
   ```

2. **Process Image Frames**
   ```c
   // Allocate buffer for all frame data
   size_t bytes_per_frame = width * height * 3;
   size_t total_size = frame_count * bytes_per_frame;
   uint8_t* frame_data = (uint8_t*)malloc(total_size);
   size_t offset = 0;
   
   // For each image in sequence
   for (int frame = 0; frame < frame_count; frame++) {
       // Extract pixels in desired order
       uint8_t* pixels = extract_pixels_in_order(images[frame], 
                                                   start_corner, 
                                                   pixel_order);
       
       // Convert to target color format
       for (int i = 0; i < width * height; i++) {
           uint8_t r = pixels[i * 3 + 0];
           uint8_t g = pixels[i * 3 + 1];
           uint8_t b = pixels[i * 3 + 2];
           
           if (strcmp(color_format, "rgb") == 0) {
               frame_data[offset++] = r;
               frame_data[offset++] = g;
               frame_data[offset++] = b;
           } else if (strcmp(color_format, "bgr") == 0) {
               frame_data[offset++] = b;
               frame_data[offset++] = g;
               frame_data[offset++] = r;
           } else if (strcmp(color_format, "grb") == 0) {
               frame_data[offset++] = g;
               frame_data[offset++] = r;
               frame_data[offset++] = b;
           }
           // ... handle other formats
       }
   }
   ```

3. **Write File**
   ```c
   FILE* fp = fopen("output.wbmani", "wb");
   if (fp) {
       fwrite(header, 1, 9, fp);
       fwrite(frame_data, 1, total_size, fp);
       fclose(fp);
   }
   
   // Clean up
   free(frame_data);
   ```

---

## Example Implementation

### C Example: Reading and Parsing

```c
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    uint16_t frame_count;
    uint16_t width;
    uint16_t height;
    char format[4];  // 3 chars + null terminator
    uint8_t** frames;  // Array of pointers to frame data
} WbmaniFile;

// Helper function to read big-endian uint16
uint16_t read_uint16_be(uint8_t* buffer) {
    return (buffer[0] << 8) | buffer[1];
}

WbmaniFile* read_wbmani(const char* filename) {
    FILE* fp = fopen(filename, "rb");
    if (!fp) {
        return NULL;
    }
    
    WbmaniFile* wbm = (WbmaniFile*)malloc(sizeof(WbmaniFile));
    
    // Read header (9 bytes)
    uint8_t header[9];
    fread(header, 1, 9, fp);
    
    // Parse header
    wbm->frame_count = read_uint16_be(&header[0]);
    wbm->width = read_uint16_be(&header[2]);
    wbm->height = read_uint16_be(&header[4]);
    memcpy(wbm->format, &header[6], 3);
    wbm->format[3] = '\0';  // Null terminate
    
    // Calculate frame size
    size_t bytes_per_frame = wbm->width * wbm->height * 3;
    
    // Allocate frame array
    wbm->frames = (uint8_t**)malloc(wbm->frame_count * sizeof(uint8_t*));
    
    // Read all frames
    for (int i = 0; i < wbm->frame_count; i++) {
        wbm->frames[i] = (uint8_t*)malloc(bytes_per_frame);
        fread(wbm->frames[i], 1, bytes_per_frame, fp);
    }
    
    fclose(fp);
    return wbm;
}

void free_wbmani(WbmaniFile* wbm) {
    if (wbm) {
        for (int i = 0; i < wbm->frame_count; i++) {
            free(wbm->frames[i]);
        }
        free(wbm->frames);
        free(wbm);
    }
}

// Convert frame pixel to RGB
void get_pixel_rgb(uint8_t* frame, int pixel_index, char* format,
                   uint8_t* r, uint8_t* g, uint8_t* b) {
    uint8_t* pixel = &frame[pixel_index * 3];
    
    if (strcmp(format, "rgb") == 0) {
        *r = pixel[0]; *g = pixel[1]; *b = pixel[2];
    } else if (strcmp(format, "bgr") == 0) {
        *b = pixel[0]; *g = pixel[1]; *r = pixel[2];
    } else if (strcmp(format, "grb") == 0) {
        *g = pixel[0]; *r = pixel[1]; *b = pixel[2];
    } else if (strcmp(format, "rbg") == 0) {
        *r = pixel[0]; *b = pixel[1]; *g = pixel[2];
    } else if (strcmp(format, "brg") == 0) {
        *b = pixel[0]; *r = pixel[1]; *g = pixel[2];
    } else if (strcmp(format, "gbr") == 0) {
        *g = pixel[0]; *b = pixel[1]; *r = pixel[2];
    }
}

// Usage example
int main() {
    WbmaniFile* animation = read_wbmani("animation.wbmani");
    if (!animation) {
        printf("Failed to open file\n");
        return 1;
    }
    
    printf("Frames: %d\n", animation->frame_count);
    printf("Size: %dx%d\n", animation->width, animation->height);
    printf("Format: %s\n", animation->format);
    
    // Access first pixel of first frame
    uint8_t r, g, b;
    get_pixel_rgb(animation->frames[0], 0, animation->format, &r, &g, &b);
    printf("First pixel: R=%d G=%d B=%d\n", r, g, b);
    
    // Clean up
    free_wbmani(animation);
    return 0;
}
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

---

## Typical Usage Pattern: Embedded Systems with DMA

The `.wbmani` format is designed for efficient playback on embedded systems (microcontrollers, Arduino, ESP32, etc.). A common implementation pattern uses **Direct Memory Access (DMA)** for high-performance, low-CPU-overhead animation playback:

### Frame-by-Frame Streaming from Flash

Rather than loading the entire animation into RAM, you can stream frames directly from flash memory to LED strips:

1. **Store .wbmani file in flash memory** (SPI flash, SD card, or internal flash)
2. **Read header once** at initialization to get frame count and dimensions
3. **Calculate frame size** in bytes: `frame_size = width × height × 3`
4. **For each frame:**
   - Use **DMA to read** frame data from flash to a buffer
   - Use **DMA to write** buffer data to LED strip controller (SPI/I2S peripheral)
   - Minimal CPU involvement during transfer

### Example Workflow

```
Initialize:
  ├─ Read 9-byte header
  ├─ Parse dimensions and format
  └─ Calculate frame_offset = 9 + (frame_index × frame_size)

Playback Loop:
  ├─ DMA: Flash → RAM Buffer (read frame at calculated offset)
  ├─ DMA: RAM Buffer → LED Strip (SPI/I2S transfer)
  ├─ Increment frame_index (wrap around at frame_count)
  └─ Repeat at desired frame rate
```

### Benefits of This Approach

- **Low Memory Footprint:** Only one or two frame buffers needed (double buffering)
- **High Performance:** DMA transfers happen in background while CPU handles timing/logic
- **Smooth Playback:** No frame stuttering from slow file I/O
- **Large Animations:** Support animations larger than available RAM

This design makes `.wbmani` ideal for LED matrix projects where animation data is pre-generated and stored for efficient real-time playback.

