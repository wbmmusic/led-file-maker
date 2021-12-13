import ArrowRightAlt from '@mui/icons-material/ArrowRightAlt'
import Flip from '@mui/icons-material/Flip'
import SwapHoriz from '@mui/icons-material/SwapHoriz'
import SwapVert from '@mui/icons-material/SwapVert'
import TransitEnterexit from '@mui/icons-material/TransitEnterexit'


import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import React, { useEffect, useState } from 'react'

export default function ImageOptions({ setOptions }) {
    const [state, setState] = useState({
        flip: {
            horizontal: false,
            vertical: false
        },
        startCorner: 'topLeft',
        pixelOrder: 'horizontal'
    })

    const flipVariant = data => { if (data === true) return 'contained' }

    const orderVariant = data => { if (state.pixelOrder === data) return 'contained' }

    const startVariant = corner => { if (corner === state.startCorner) return 'contained' }

    const startCornerGroup = () => (
        <div>
            <div style={labelStyle} >Start Corner</div>
            <div>
                <ButtonGroup>
                    <Button size='small' variant={startVariant('topLeft')} onClick={() => setState(old => ({ ...old, startCorner: 'topLeft' }))} >
                        <TransitEnterexit style={{ transform: 'rotate(90deg)' }} />
                    </Button>
                    <Button size='small' variant={startVariant('bottomLeft')} onClick={() => setState(old => ({ ...old, startCorner: 'bottomLeft' }))} >
                        <TransitEnterexit />
                    </Button>
                    <Button size='small' variant={startVariant('topRight')} onClick={() => setState(old => ({ ...old, startCorner: 'topRight' }))} >
                        <TransitEnterexit style={{ transform: 'rotate(180deg)' }} />
                    </Button>
                    <Button size='small' variant={startVariant('bottomRight')} onClick={() => setState(old => ({ ...old, startCorner: 'bottomRight' }))} >
                        <TransitEnterexit style={{ transform: 'rotate(270deg)' }} />
                    </Button>
                </ButtonGroup>
            </div>
        </div>
    )

    const flipGroup = () => (
        <div>
            <div style={labelStyle}>Flip Image</div>
            <div>
                <ButtonGroup>
                    <Tooltip title='Flip Horizontal' >
                        <Button
                            size='small'
                            variant={flipVariant(state.flip.horizontal)}
                            onClick={() => setState(old => ({ ...old, flip: { ...old.flip, horizontal: !state.flip.horizontal } }))}
                        ><Flip style={{ transform: 'rotate(90deg)' }} /></Button>
                    </Tooltip>
                    <Tooltip title='Flip Vertical' >
                        <Button
                            size='small'
                            variant={flipVariant(state.flip.vertical)}
                            onClick={() => setState(old => ({ ...old, flip: { ...old.flip, vertical: !state.flip.vertical } }))}
                        ><Flip /></Button>
                    </Tooltip>
                </ButtonGroup>
            </div>
        </div>

    )

    const orderGroup = () => {

        const horizontal = () => {
            const makeIcon = () => {
                if (state.startCorner === 'topLeft' || state.startCorner === 'bottomLeft') return <ArrowRightAlt />
                else return <ArrowRightAlt style={{ transform: 'scaleX(-1)' }} />
            }

            return (
                <Tooltip title="Horizontal" >
                    <Button
                        size='small'
                        variant={orderVariant('horizontal')}
                        onClick={() => setState(old => ({ ...old, pixelOrder: 'horizontal' }))}
                    >
                        {makeIcon()}
                    </Button>
                </Tooltip >
            )
        }

        const vertical = () => {

            const makeIcon = () => {
                if (state.startCorner === 'topLeft' || state.startCorner === 'topRight') return <ArrowRightAlt style={{ transform: 'rotate(90deg)' }} />
                else return <ArrowRightAlt style={{ transform: 'rotate(270deg)' }} />
            }

            return (
                <Tooltip title="Vertical">
                    <Button
                        size='small'
                        variant={orderVariant('vertical')}
                        onClick={() => setState(old => ({ ...old, pixelOrder: 'vertical' }))}
                    >
                        {makeIcon()}
                    </Button>
                </Tooltip>
            )
        }

        const verticalAlternate = () => {
            const makeIcon = () => {
                if (state.startCorner === 'topLeft' || state.startCorner === 'bottomRight') return <SwapVert style={{ transform: 'scaleX(-1)' }} />
                else return <SwapVert style={{ transform: 'scaleX(-1)' }} />
            }

            return (
                <Tooltip title="Vertical alternate">
                    <Button
                        size='small'
                        variant={orderVariant('verticalAlternate')}
                        onClick={() => setState(old => ({ ...old, pixelOrder: 'verticalAlternate' }))}
                    >
                        {makeIcon()}
                    </Button>
                </Tooltip>
            )
        }

        const horizontalAlternate = () => {
            const makeIcon = () => {
                if (state.startCorner === 'bottomLeft' || state.startCorner === 'topRight') return <SwapHoriz style={{ transform: 'scaleY(-1)' }} />
                else return <SwapHoriz />
            }

            return (
                <Tooltip title="Horizontal alternate">
                    <Button
                        size='small'
                        variant={orderVariant('horizontalAlternate')}
                        onClick={() => setState(old => ({ ...old, pixelOrder: 'horizontalAlternate' }))}
                    >
                        {makeIcon()}
                    </Button>
                </Tooltip>
            )
        }

        const makeBody = () => {
            switch (state.startCorner) {
                case 'topLeft':
                    return (
                        <ButtonGroup>
                            {horizontal()}
                            {vertical()}
                            {horizontalAlternate()}
                            {verticalAlternate()}
                        </ButtonGroup>
                    )

                case 'bottomLeft':
                    return (
                        <ButtonGroup>
                            {horizontal()}
                            {vertical()}
                            {horizontalAlternate()}
                            {verticalAlternate()}
                        </ButtonGroup>
                    )

                case 'topRight':
                    return (
                        <ButtonGroup>
                            {horizontal()}
                            {vertical()}
                            {horizontalAlternate()}
                            {verticalAlternate()}
                        </ButtonGroup>
                    )

                case 'bottomRight':
                    return (
                        <ButtonGroup>
                            {horizontal()}
                            {vertical()}
                            {horizontalAlternate()}
                            {verticalAlternate()}
                        </ButtonGroup>
                    )

                default:
                    return <div>Error</div>
            }
        }

        return (
            <div>
                <div style={labelStyle}>Pixel Order</div>
                <div>
                    {makeBody()}
                </div>
            </div>
        )
    }

    useEffect(() => {
        setOptions(state)
    }, [state, setOptions])

    return (
        <div style={{ display: 'flex' }}>
            {startCornerGroup()}
            <div style={{ width: '10px', display: 'inline-block' }} />
            {flipGroup()}
            <div style={{ width: '10px', display: 'inline-block' }} />
            {orderGroup()}
        </div>
    )
}

const labelStyle = { fontSize: '14px' }