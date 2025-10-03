/**
 * ImageOptions Component
 * 
 * Interactive configuration panel for LED matrix settings.
 * Allows users to configure:
 * - Start Corner: Which physical corner the LED data line begins (topLeft, topRight, bottomLeft, bottomRight)
 * - Pixel Order: How LEDs are wired (horizontal, vertical, snake patterns)
 * - Flip Image: Mirror transformations (horizontal/vertical)
 * 
 * These settings are critical because different LED matrix hardware can have:
 * - Different starting positions for the data line
 * - Different wiring patterns (straight lines vs. alternating/snake patterns)
 * - Different orientations
 * 
 * The component provides visual button interfaces with icons representing
 * the different configuration options.
 */

import React, { useEffect, useState } from 'react';
import ArrowRightAlt from '@mui/icons-material/ArrowRightAlt';
import Flip from '@mui/icons-material/Flip';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import SwapVert from '@mui/icons-material/SwapVert';
import TransitEnterexit from '@mui/icons-material/TransitEnterexit';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import { ImageOptionsProps, ImageOptions } from '../../types';

/**
 * LED matrix configuration component
 * 
 * @param props.setOptions - Callback invoked when options change
 * @returns The rendered configuration panel
 */
export default function ImageOptionsComponent({ setOptions }: ImageOptionsProps): JSX.Element {
  // Current configuration state
  const [state, setState] = useState<ImageOptions>({
    flip: {
      horizontal: false,
      vertical: false,
    },
    startCorner: 'topLeft',
    pixelOrder: 'horizontal',
  });

  /**
   * Determine button variant based on flip state
   * @param data - Whether this flip direction is active
   * @returns 'contained' if active, undefined otherwise
   */
  const flipVariant = (data: boolean): 'contained' | undefined => {
    if (data === true) return 'contained';
    return undefined;
  };

  /**
   * Determine button variant based on pixel order
   * @param data - The pixel order to check
   * @returns 'contained' if this order is selected, undefined otherwise
   */
  const orderVariant = (data: string): 'contained' | undefined => {
    if (state.pixelOrder === data) return 'contained';
    return undefined;
  };

  /**
   * Determine button variant based on start corner
   * @param corner - The corner to check
   * @returns 'contained' if this corner is selected, undefined otherwise
   */
  const startVariant = (corner: string): 'contained' | undefined => {
    if (corner === state.startCorner) return 'contained';
    return undefined;
  };

  /**
   * Render start corner selection buttons
   * Four buttons representing the four corners of the LED matrix
   * Icons are rotated to indicate the corner position
   */
  const startCornerGroup = (): JSX.Element => (
    <div>
      <div style={labelStyle}>Start Corner</div>
      <div>
        <ButtonGroup>
          {/* Top-left corner (entry arrow pointing down-right) */}
          <Button
            size="small"
            variant={startVariant('topLeft')}
            onClick={() =>
              setState(old => ({ ...old, startCorner: 'topLeft' }))
            }
          >
            <TransitEnterexit style={{ transform: 'rotate(90deg)' }} />
          </Button>
          {/* Bottom-left corner (entry arrow pointing up-right) */}
          <Button
            size="small"
            variant={startVariant('bottomLeft')}
            onClick={() =>
              setState(old => ({ ...old, startCorner: 'bottomLeft' }))
            }
          >
            <TransitEnterexit />
          </Button>
          {/* Top-right corner (entry arrow pointing down-left) */}
          <Button
            size="small"
            variant={startVariant('topRight')}
            onClick={() =>
              setState(old => ({ ...old, startCorner: 'topRight' }))
            }
          >
            <TransitEnterexit style={{ transform: 'rotate(180deg)' }} />
          </Button>
          {/* Bottom-right corner (entry arrow pointing up-left) */}
          <Button
            size="small"
            variant={startVariant('bottomRight')}
            onClick={() =>
              setState(old => ({ ...old, startCorner: 'bottomRight' }))
            }
          >
            <TransitEnterexit style={{ transform: 'rotate(270deg)' }} />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );

  /**
   * Render image flip toggle buttons
   * Allows horizontal and/or vertical mirroring of the image
   */
  const flipGroup = (): JSX.Element => (
    <div>
      <div style={labelStyle}>Flip Image</div>
      <div>
        <ButtonGroup>
          {/* Horizontal flip (mirror left-right) */}
          <Tooltip title="Flip Horizontal">
            <Button
              size="small"
              variant={flipVariant(state.flip.horizontal)}
              onClick={() =>
                setState(old => ({
                  ...old,
                  flip: { ...old.flip, horizontal: !state.flip.horizontal },
                }))
              }
            >
              <Flip style={{ transform: 'rotate(90deg)' }} />
            </Button>
          </Tooltip>
          {/* Vertical flip (mirror top-bottom) */}
          <Tooltip title="Flip Vertical">
            <Button
              size="small"
              variant={flipVariant(state.flip.vertical)}
              onClick={() =>
                setState(old => ({
                  ...old,
                  flip: { ...old.flip, vertical: !state.flip.vertical },
                }))
              }
            >
              <Flip />
            </Button>
          </Tooltip>
        </ButtonGroup>
      </div>
    </div>
  );

  /**
   * Render pixel order selection buttons
   * Available options depend on the selected start corner
   * 
   * Different LED matrices have different wiring patterns:
   * - Horizontal: Simple left-to-right or right-to-left rows
   * - Vertical: Simple top-to-bottom or bottom-to-top columns
   * - Horizontal Alternate: Snake pattern - alternating row directions
   * - Vertical Alternate: Snake pattern - alternating column directions
   */
  const orderGroup = (): JSX.Element => {
    /**
     * Horizontal direction button
     * Arrow direction depends on start corner
     */
    const horizontal = (): JSX.Element => {
      const makeIcon = (): JSX.Element => {
        if (
          state.startCorner === 'topLeft' ||
          state.startCorner === 'bottomLeft'
        )
          return <ArrowRightAlt />;
        else return <ArrowRightAlt style={{ transform: 'scaleX(-1)' }} />;
      };

      return (
        <Tooltip title="Horizontal">
          <Button
            size="small"
            variant={orderVariant('horizontal')}
            onClick={() =>
              setState(old => ({ ...old, pixelOrder: 'horizontal' }))
            }
          >
            {makeIcon()}
          </Button>
        </Tooltip>
      );
    };

    /**
     * Vertical direction button
     * Arrow direction depends on start corner
     */
    const vertical = (): JSX.Element => {
      const makeIcon = (): JSX.Element => {
        if (state.startCorner === 'topLeft' || state.startCorner === 'topRight')
          return <ArrowRightAlt style={{ transform: 'rotate(90deg)' }} />;
        else return <ArrowRightAlt style={{ transform: 'rotate(270deg)' }} />;
      };

      return (
        <Tooltip title="Vertical">
          <Button
            size="small"
            variant={orderVariant('vertical')}
            onClick={() =>
              setState(old => ({ ...old, pixelOrder: 'vertical' }))
            }
          >
            {makeIcon()}
          </Button>
        </Tooltip>
      );
    };

    /**
     * Vertical alternating (snake) pattern button
     * Used when LEDs snake vertically - alternating up/down per column
     */
    const verticalAlternate = (): JSX.Element => {
      const makeIcon = (): JSX.Element => {
        // Icon always shows swap/alternate pattern
        return <SwapVert style={{ transform: 'scaleX(-1)' }} />;
      };

      return (
        <Tooltip title="Vertical alternate">
          <Button
            size="small"
            variant={orderVariant('verticalAlternate')}
            onClick={() =>
              setState(old => ({ ...old, pixelOrder: 'verticalAlternate' }))
            }
          >
            {makeIcon()}
          </Button>
        </Tooltip>
      );
    };

    /**
     * Horizontal alternating (snake) pattern button
     * Used when LEDs snake horizontally - alternating left/right per row
     */
    const horizontalAlternate = (): JSX.Element => {
      const makeIcon = (): JSX.Element => {
        if (
          state.startCorner === 'bottomLeft' ||
          state.startCorner === 'topRight'
        )
          return <SwapHoriz style={{ transform: 'scaleY(-1)' }} />;
        else return <SwapHoriz />;
      };

      return (
        <Tooltip title="Horizontal alternate">
          <Button
            size="small"
            variant={orderVariant('horizontalAlternate')}
            onClick={() =>
              setState(old => ({ ...old, pixelOrder: 'horizontalAlternate' }))
            }
          >
            {makeIcon()}
          </Button>
        </Tooltip>
      );
    };

    /**
     * Render appropriate buttons based on start corner
     * Different corners support different pixel order patterns
     */
    const makeBody = (): JSX.Element => {
      switch (state.startCorner) {
        case 'topLeft':
          return (
            <ButtonGroup>
              {horizontal()}
              {vertical()}
              {horizontalAlternate()}
              {verticalAlternate()}
            </ButtonGroup>
          );

        case 'bottomLeft':
          return (
            <ButtonGroup>
              {horizontal()}
              {vertical()}
              {horizontalAlternate()}
              {verticalAlternate()}
            </ButtonGroup>
          );

        case 'topRight':
          return (
            <ButtonGroup>
              {horizontal()}
              {vertical()}
              {horizontalAlternate()}
              {verticalAlternate()}
            </ButtonGroup>
          );

        case 'bottomRight':
          return (
            <ButtonGroup>
              {horizontal()}
              {vertical()}
              {horizontalAlternate()}
              {verticalAlternate()}
            </ButtonGroup>
          );

        default:
          return <div>Error</div>;
      }
    };

    return (
      <div>
        <div style={labelStyle}>Pixel Order</div>
        <div>{makeBody()}</div>
      </div>
    );
  };

  /**
   * Notify parent component whenever options change
   */
  useEffect(() => {
    setOptions(state);
  }, [state, setOptions]);

  return (
    <div style={{ display: 'inline-block' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {startCornerGroup()}
        <div style={{ width: '10px', display: 'inline-block' }} />
        {flipGroup()}
        <div style={{ width: '10px', display: 'inline-block' }} />
        {orderGroup()}
      </div>
    </div>
  );
}

// Shared label styling
const labelStyle: React.CSSProperties = { fontSize: '14px' };
