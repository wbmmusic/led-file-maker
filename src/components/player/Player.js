import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import React, { Fragment, useEffect, useRef, useState } from 'react'

export default function Player() {
    const [file, setFile] = useState({ data: [] })
    const [frame, setFrame] = useState(null)

    const canvasRef = useRef(null)
    const imageRef = useRef(null)

    const numberFromTwoBytes = (highByte, lowByte) => {
        let out = 0
        out = highByte << 8
        out = out | lowByte
        return out
    }

    const handleOpenFile = () => {
        window.k.ipcRenderer.invoke('openAniFile')
            .then(res => {
                if (res !== 'canceled') {
                    setFile({
                        data: res,
                        frames: numberFromTwoBytes(res[0], res[1]),
                        width: numberFromTwoBytes(res[2], res[3]),
                        height: numberFromTwoBytes(res[4], res[5]),
                        format: String.fromCharCode(res[6], res[7], res[8])
                    })
                } else {
                    console.log('canceled')
                }
            })
            .catch(err => console.log(err))
    }

    useEffect(() => {
        if (file.data.length > 0) {
            // first file or new file
            console.log("Open File", file)
            setFrame(0)
        }
    }, [file])

    useEffect(() => {

        const getBytes = (start, length) => {
            let out = []
            for (let i = 0; i < length; i++) {
                out.push(file.data[start + i])
            }
            return out
        }

        //console.log(frame)
        let timer
        if (frame === null) {

        } else {
            let canvas = canvasRef.current
            let ctx = canvas.getContext('2d')
            const imageData = ctx.createImageData(file.width, file.height);

            const numberOfPixels = file.width * file.height
            const startOfFrame = (frame * numberOfPixels * 3) + 9

            let frameData = getBytes(startOfFrame, numberOfPixels * 3)

            //console.log("Pixels", numberOfPixels, 'Frame:', frame, "Start of frame:", startOfFrame)
            let getRGB

            switch (file.format) {
                case 'rgb':
                    getRGB = (r, g, b) => [r, g, b]
                    break;

                case 'rbg':
                    getRGB = (r, b, g) => [r, g, b]
                    break;

                case 'bgr':
                    getRGB = (b, g, r) => [r, g, b]
                    break;

                case 'brg':
                    getRGB = (b, r, g) => [r, g, b]
                    break;

                case 'grb':
                    getRGB = (g, r, b) => [r, g, b]
                    break;

                case 'gbr':
                    getRGB = (g, b, r) => [r, g, b]
                    break;

                default:
                    getRGB = (r, g, b) => [r, g, b]
                    break;
            }

            for (let i = 0; i < numberOfPixels; i++) {

                let data = getRGB(frameData[i * 3], frameData[(i * 3) + 1], frameData[(i * 3) + 2])

                // Modify pixel data
                imageData.data[(i * 4) + 0] = data[0];  // R value
                imageData.data[(i * 4) + 1] = data[1];    // G value
                imageData.data[(i * 4) + 2] = data[2];  // B value
                imageData.data[(i * 4) + 3] = 255;  // A value
            }

            ctx.putImageData(imageData, 0, 0)
            imageRef.current.src = canvas.toDataURL()


            timer = setTimeout(() => {
                setFrame(old => {
                    if (old + 1 >= file.frames) return 0
                    return old + 1
                })
            }, 33);
        }



        return () => clearTimeout(timer)

    }, [frame, file])

    const makeInfo = () => {
        if (file.data.length > 0 && frame !== null) {
            return (
                <Fragment>
                    <Button size='small' color='error' onClick={() => setFrame(null)} >Clear File</Button>
                    <div style={{ display: 'inline-block', marginLeft: '10px', fontSize: '12px', width: '20px', textAlign: 'center' }}>{frame}</div>
                    <div style={{ display: 'inline-block', marginLeft: '10px', fontSize: '12px' }}>Frames: {file.frames}</div>
                    <div style={{ display: 'inline-block', marginLeft: '10px', fontSize: '12px' }}> {"Res: " + file.width + ' x ' + file.height}</div>
                    <div style={{ display: 'inline-block', marginLeft: '10px', fontSize: '12px' }}> {"Format: " + file.format.toUpperCase()}</div>
                </Fragment>
            )
        }

    }

    const makePlayer = () => {
        if (file.data.length <= 0 || frame === null) return <div />

        return (
            <div>
                <canvas ref={canvasRef} width={file.width} height={file.height} />
                <div>
                    <img style={{ width: '100%', maxHeight: '300px' }} ref={imageRef} src={null} alt="larger" />
                </div>
            </div>
        )
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center' }} >
                <Button size='small' onClick={handleOpenFile}>Open File</Button>
                {makeInfo()}
            </div>
            <Divider style={{ marginBottom: '6px' }} />
            {makePlayer()}
        </div>
    )
}
