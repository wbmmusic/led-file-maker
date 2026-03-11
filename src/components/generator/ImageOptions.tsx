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
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ImageOptionsProps, ImageOptions } from '../../types';

/**
 * LED matrix configuration component
 * 
 * @param props.setOptions - Callback invoked when options change
 * @returns The rendered configuration panel
 */
export default function ImageOptionsComponent({
  setOptions,
  inline = false,
  showSummary = true,
  imageWidth,
  imageHeight,
  disableHorizontalFlip = false,
  disableVerticalFlip = false,
}: ImageOptionsProps): JSX.Element {
  type StartCorner = ImageOptions['startCorner'];
  type PixelOrder = ImageOptions['pixelOrder'];

  const supportedPixelOrders: Record<StartCorner, PixelOrder[]> = {
    topLeft: ['horizontal', 'vertical', 'horizontalAlternate'],
    topRight: ['horizontal', 'horizontalAlternate'],
    bottomLeft: ['horizontal', 'verticalAlternate'],
    bottomRight: ['vertical', 'verticalAlternate'],
  };

  const isSingleRow = imageHeight === 1;
  const isSingleColumn = imageWidth === 1;

  const isCornerSupported = (corner: StartCorner): boolean => {
    if (isSingleRow && (corner === 'bottomLeft' || corner === 'bottomRight')) {
      return false;
    }
    if (isSingleColumn && (corner === 'topRight' || corner === 'bottomRight')) {
      return false;
    }
    return true;
  };

  const getNormalizedStartCorner = (corner: StartCorner): StartCorner => {
    let next = corner;

    if (isSingleRow && (next === 'bottomLeft' || next === 'bottomRight')) {
      next = next === 'bottomLeft' ? 'topLeft' : 'topRight';
    }

    if (isSingleColumn && (next === 'topRight' || next === 'bottomRight')) {
      next = next === 'topRight' ? 'topLeft' : 'bottomLeft';
    }

    if (!isCornerSupported(next)) {
      return 'topLeft';
    }

    return next;
  };

  const getValidPixelOrder = (startCorner: StartCorner, pixelOrder: PixelOrder): PixelOrder => {
    const normalizedCorner = getNormalizedStartCorner(startCorner);
    const allowed = supportedPixelOrders[normalizedCorner].filter(order => {
      if (isSingleRow && order === 'horizontalAlternate') return false;
      if (isSingleColumn && order === 'verticalAlternate') return false;
      return true;
    });
    if (allowed.includes(pixelOrder)) return pixelOrder;
    return allowed[0] ?? 'horizontal';
  };

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

  const isOrderSupported = (order: PixelOrder): boolean => {
    if (isSingleRow && order === 'horizontalAlternate') return false;
    if (isSingleColumn && order === 'verticalAlternate') return false;
    const normalizedCorner = getNormalizedStartCorner(state.startCorner);
    return supportedPixelOrders[normalizedCorner].includes(order);
  };

  const cornerLabel: Record<StartCorner, string> = {
    topLeft: 'Top-Left',
    topRight: 'Top-Right',
    bottomLeft: 'Bottom-Left',
    bottomRight: 'Bottom-Right',
  };

  const orderLabel: Record<PixelOrder, string> = {
    horizontal: 'Horizontal',
    vertical: 'Vertical',
    horizontalAlternate: 'Horizontal Alternate',
    verticalAlternate: 'Vertical Alternate',
  };

  const selectedButtonSx = {
    borderColor: '#0f59a9 !important',
    background: 'linear-gradient(135deg, #1f7ad6 0%, #125ea8 100%)',
    color: '#fff',
    boxShadow: '0 4px 10px rgba(17, 86, 155, 0.25)',
    '&:hover': {
      background: 'linear-gradient(135deg, #176bbb 0%, #0f4f8d 100%)',
    },
  };

  const groupCardSx = {
    p: 0.75,
    borderRadius: 1.5,
    border: '1px solid #cfdaea',
    background: 'linear-gradient(180deg, #ffffff 0%, #f6faff 100%)',
  };

  const buttonGroupSx = {
    '& .MuiButton-root': {
      minWidth: 32,
      minHeight: 26,
      padding: '2px 6px',
    },
    '& .MuiSvgIcon-root': {
      fontSize: 17,
    },
  };

  /**
   * Render start corner selection buttons
   * Four buttons representing the four corners of the LED matrix
   * Icons are rotated to indicate the corner position
   */
  const startCornerGroup = (): JSX.Element => (
    <Paper elevation={0} sx={groupCardSx}>
      <Typography sx={labelStyle}>Start Corner</Typography>
      <Box>
        <ButtonGroup sx={buttonGroupSx}>
          {/* Top-left corner (entry arrow pointing down-right) */}
          <Button
            size="small"
            disabled={!isCornerSupported('topLeft')}
            variant={startVariant('topLeft')}
            sx={state.startCorner === 'topLeft' ? selectedButtonSx : undefined}
            onClick={() =>
              setState(old => ({
                ...old,
                startCorner: getNormalizedStartCorner('topLeft'),
                pixelOrder: getValidPixelOrder('topLeft', old.pixelOrder),
              }))
            }
          >
            <TransitEnterexit style={{ transform: 'rotate(90deg)' }} />
          </Button>
          {/* Bottom-left corner (entry arrow pointing up-right) */}
          <Button
            size="small"
            disabled={!isCornerSupported('bottomLeft')}
            variant={startVariant('bottomLeft')}
            sx={state.startCorner === 'bottomLeft' ? selectedButtonSx : undefined}
            onClick={() =>
              setState(old => ({
                ...old,
                startCorner: getNormalizedStartCorner('bottomLeft'),
                pixelOrder: getValidPixelOrder('bottomLeft', old.pixelOrder),
              }))
            }
          >
            <TransitEnterexit />
          </Button>
          {/* Top-right corner (entry arrow pointing down-left) */}
          <Button
            size="small"
            disabled={!isCornerSupported('topRight')}
            variant={startVariant('topRight')}
            sx={state.startCorner === 'topRight' ? selectedButtonSx : undefined}
            onClick={() =>
              setState(old => ({
                ...old,
                startCorner: getNormalizedStartCorner('topRight'),
                pixelOrder: getValidPixelOrder('topRight', old.pixelOrder),
              }))
            }
          >
            <TransitEnterexit style={{ transform: 'rotate(180deg)' }} />
          </Button>
          {/* Bottom-right corner (entry arrow pointing up-left) */}
          <Button
            size="small"
            disabled={!isCornerSupported('bottomRight')}
            variant={startVariant('bottomRight')}
            sx={state.startCorner === 'bottomRight' ? selectedButtonSx : undefined}
            onClick={() =>
              setState(old => ({
                ...old,
                startCorner: getNormalizedStartCorner('bottomRight'),
                pixelOrder: getValidPixelOrder('bottomRight', old.pixelOrder),
              }))
            }
          >
            <TransitEnterexit style={{ transform: 'rotate(270deg)' }} />
          </Button>
        </ButtonGroup>
      </Box>
      <Typography sx={hintStyle}>{cornerLabel[state.startCorner]}</Typography>
    </Paper>
  );

  /**
   * Render image flip toggle buttons
   * Allows horizontal and/or vertical mirroring of the image
   */
  const flipGroup = (): JSX.Element => (
    <Paper elevation={0} sx={groupCardSx}>
      <Typography sx={labelStyle}>Flip Image</Typography>
      <Box>
        <ButtonGroup sx={buttonGroupSx}>
          {/* Horizontal flip (mirror left-right) */}
          <Tooltip
            title={disableHorizontalFlip ? 'Disabled when image height is 1px' : 'Flip Horizontal'}
          >
            <Button
              size="small"
              disabled={disableHorizontalFlip}
              variant={flipVariant(state.flip.horizontal)}
              sx={state.flip.horizontal ? selectedButtonSx : undefined}
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
          <Tooltip
            title={disableVerticalFlip ? 'Disabled when image width is 1px' : 'Flip Vertical'}
          >
            <Button
              size="small"
              disabled={disableVerticalFlip}
              variant={flipVariant(state.flip.vertical)}
              sx={state.flip.vertical ? selectedButtonSx : undefined}
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
      </Box>
      <Typography sx={hintStyle}>
        {`H ${state.flip.horizontal ? 'On' : 'Off'} • V ${state.flip.vertical ? 'On' : 'Off'}`}
      </Typography>
    </Paper>
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
            disabled={!isOrderSupported('horizontal')}
            variant={orderVariant('horizontal')}
            sx={state.pixelOrder === 'horizontal' ? selectedButtonSx : undefined}
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
            disabled={!isOrderSupported('vertical')}
            variant={orderVariant('vertical')}
            sx={state.pixelOrder === 'vertical' ? selectedButtonSx : undefined}
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
        <Tooltip
          title={
            isSingleColumn
              ? 'Disabled when image width is 1px'
              : 'Vertical alternate'
          }
        >
          <Button
            size="small"
            disabled={!isOrderSupported('verticalAlternate')}
            variant={orderVariant('verticalAlternate')}
            sx={state.pixelOrder === 'verticalAlternate' ? selectedButtonSx : undefined}
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
        <Tooltip
          title={
            isSingleRow
              ? 'Disabled when image height is 1px'
              : 'Horizontal alternate'
          }
        >
          <Button
            size="small"
            disabled={!isOrderSupported('horizontalAlternate')}
            variant={orderVariant('horizontalAlternate')}
            sx={state.pixelOrder === 'horizontalAlternate' ? selectedButtonSx : undefined}
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
            <ButtonGroup sx={buttonGroupSx}>
              {horizontal()}
              {vertical()}
              {horizontalAlternate()}
              {verticalAlternate()}
            </ButtonGroup>
          );

        case 'bottomLeft':
          return (
            <ButtonGroup sx={buttonGroupSx}>
              {horizontal()}
              {vertical()}
              {horizontalAlternate()}
              {verticalAlternate()}
            </ButtonGroup>
          );

        case 'topRight':
          return (
            <ButtonGroup sx={buttonGroupSx}>
              {horizontal()}
              {vertical()}
              {horizontalAlternate()}
              {verticalAlternate()}
            </ButtonGroup>
          );

        case 'bottomRight':
          return (
            <ButtonGroup sx={buttonGroupSx}>
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
      <Paper elevation={0} sx={groupCardSx}>
        <Typography sx={labelStyle}>Pixel Order</Typography>
        <Box>{makeBody()}</Box>
        <Typography sx={hintStyle}>{orderLabel[state.pixelOrder]}</Typography>
      </Paper>
    );
  };

  /**
   * Notify parent component whenever options change
   */
  useEffect(() => {
    setOptions(state);
  }, [state, setOptions]);

  // Keep selected corner/order valid when dimensions collapse to a single row/column.
  useEffect(() => {
    setState(old => {
      const normalizedCorner = getNormalizedStartCorner(old.startCorner);
      const normalizedOrder = getValidPixelOrder(normalizedCorner, old.pixelOrder);
      if (normalizedCorner === old.startCorner && normalizedOrder === old.pixelOrder) {
        return old;
      }
      return {
        ...old,
        startCorner: normalizedCorner,
        pixelOrder: normalizedOrder,
      };
    });
  }, [isSingleRow, isSingleColumn]);

  // Ensure flip state is valid when one-axis images disable a flip control.
  useEffect(() => {
    if (!disableHorizontalFlip && !disableVerticalFlip) return;

    setState(old => {
      const nextHorizontal = disableHorizontalFlip ? false : old.flip.horizontal;
      const nextVertical = disableVerticalFlip ? false : old.flip.vertical;
      if (nextHorizontal === old.flip.horizontal && nextVertical === old.flip.vertical) {
        return old;
      }
      return {
        ...old,
        flip: {
          horizontal: nextHorizontal,
          vertical: nextVertical,
        },
      };
    });
  }, [disableHorizontalFlip, disableVerticalFlip]);

  return (
    <Box sx={{ display: 'grid', gap: inline ? 0 : 0.6 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: inline ? { xs: 'wrap', xl: 'nowrap' } : 'wrap',
          gap: 0.7,
          alignItems: 'center',
        }}
      >
        {startCornerGroup()}
        {flipGroup()}
        {orderGroup()}
      </Box>
      {showSummary && (
        <Typography sx={summaryStyle}>
          {`Start: ${cornerLabel[state.startCorner]} • Flip: H ${state.flip.horizontal ? 'On' : 'Off'}, V ${state.flip.vertical ? 'On' : 'Off'} • Order: ${orderLabel[state.pixelOrder]}`}
        </Typography>
      )}
    </Box>
  );
}

// Shared label styling
const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#294566',
  marginBottom: '4px',
};

const hintStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#4d6888',
  marginTop: '4px',
};

const summaryStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#395778',
  background: '#edf3fb',
  border: '1px solid #d3dfef',
  borderRadius: '8px',
  padding: '4px 8px',
};
