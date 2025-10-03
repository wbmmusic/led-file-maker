/**
 * Type definitions for the WBM Animation (.wbmani) file format
 * 
 * The .wbmani format is a custom binary format for storing LED animation sequences.
 * It consists of a header followed by raw frame data.
 */

/**
 * Supported RGB color channel orders for LED output
 * Different LED strips may require different color orderings
 */
export type ColorFormat = 'rgb' | 'rbg' | 'bgr' | 'brg' | 'grb' | 'gbr';

/**
 * Starting corner position for LED matrix addressing
 */
export type StartCorner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

/**
 * Pixel traversal order patterns for LED matrices
 * - horizontal: Left-to-right, top-to-bottom (or reversed based on start corner)
 * - vertical: Top-to-bottom, left-to-right (or reversed based on start corner)
 * - horizontalAlternate: Snake pattern horizontally (alternating directions per row)
 * - verticalAlternate: Snake pattern vertically (alternating directions per column)
 */
export type PixelOrder = 'horizontal' | 'vertical' | 'horizontalAlternate' | 'verticalAlternate';

/**
 * Image flip/mirror transformations
 */
export interface FlipOptions {
  /** Flip image horizontally (mirror left-right) */
  horizontal: boolean;
  /** Flip image vertically (mirror top-bottom) */
  vertical: boolean;
}

/**
 * Complete configuration for LED image export
 * Defines how images are transformed and arranged for specific LED hardware
 */
export interface ImageOptions {
  /** Which corner the LED data stream starts from */
  startCorner: StartCorner;
  /** Order in which pixels are addressed in the LED matrix */
  pixelOrder: PixelOrder;
  /** Image flip transformations */
  flip: FlipOptions;
}

/**
 * Metadata about an image file in the source folder
 */
export interface FileInfo {
  /** Width of the image in pixels */
  width: number;
  /** Height of the image in pixels */
  height: number;
  /** Image format type (e.g., 'png', 'jpg') */
  type?: string;
  /** Filename of the image */
  name: string;
}

/**
 * Structure of the .wbmani file header (9 bytes total)
 * 
 * Byte layout:
 * 0-1: Frame count (16-bit big-endian)
 * 2-3: Width in pixels (16-bit big-endian)
 * 4-5: Height in pixels (16-bit big-endian)
 * 6-8: Color format (3 ASCII characters, e.g., 'rgb')
 */
export interface WbmAniHeader {
  /** Total number of frames in the animation */
  frames: number;
  /** Width of each frame in pixels */
  width: number;
  /** Height of each frame in pixels */
  height: number;
  /** Color channel order for pixel data */
  format: ColorFormat;
}

/**
 * Complete parsed .wbmani file structure
 */
export interface WbmAniFile extends WbmAniHeader {
  /** Raw binary data of the entire file */
  data: Buffer | Uint8Array;
  /** Filename of the .wbmani file */
  name: string;
}

/**
 * Export operation configuration
 */
export interface ExportConfig {
  /** Output file path */
  path: string;
  /** Color format for the output */
  format: ColorFormat;
  /** Image transformation and pixel ordering options */
  imageOptions: ImageOptions;
}
