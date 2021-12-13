import React, { useState } from 'react'
import ImageProcessor from './ImageProcessor'

export default function Export({ files, close, format, path, imageOptions }) {
    const [currentFrame, setCurrentFrame] = useState(0)

    const handleFrameOutput = async (data) => {
        try {
            if (currentFrame === 0) {
                let headerAndFirstFrame = [
                    ...makeTwoBytesFromNumber(files.length),
                    ...makeTwoBytesFromNumber(files[0].width),
                    ...makeTwoBytesFromNumber(files[0].height),
                    ...makeFormatBytes(),
                    ...data
                ]
                await window.k.ipcRenderer.invoke('exportFrame', { frame: currentFrame, path: path, data: headerAndFirstFrame })
                setCurrentFrame(old => old + 1)
            } else {
                await window.k.ipcRenderer.invoke('exportFrame', { frame: currentFrame, path: path, data: data })
                setCurrentFrame(old => old + 1)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const makeTwoBytesFromNumber = (number) => {
        const highByte = (number >> 8) & 0xFF
        const lowByte = number & 0xFF
        return [highByte, lowByte]
    }

    const makeFormatBytes = () => [format.charCodeAt(0), format.charCodeAt(1), format.charCodeAt(2)]

    const closeExport = async () => {
        await window.k.ipcRenderer.invoke('exportFrame', { frame: 'end', path: path, data: null })
        close()
    }

    if (currentFrame >= files.length) {
        closeExport()
        return (<div />)
    }

    return (
        <div>
            <div>
                {"Processing: " + files[currentFrame].name || "File Name"}
            </div>
            <ImageProcessor imageOptions={imageOptions} format={format} file={files[currentFrame]} data={handleFrameOutput} />
        </div>
    )
}
