import React, { useEffect, useRef } from 'react'

export default function ImageProcessor({ file, data, format, imageOptions }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        if (file !== null && file !== undefined) {
            var img = new Image()
            img.src = `atom://${file.name}`
            const canvas = canvasRef.current
            const context = canvas.getContext('2d')
            context.clearRect(0, 0, file.width, file.height)
            context.drawImage(img, 0, 0)
            let imageData = context.getImageData(0, 0, file.width, file.height)
            //console.log(imageData)
            let outData = []

            let copyPixels

            switch (format) {
                case 'rgb':
                    copyPixels = (r, g, b) => outData.push(r, g, b)
                    break;

                case 'rbg':
                    copyPixels = (r, g, b) => outData.push(r, b, g)
                    break;

                case 'bgr':
                    copyPixels = (r, g, b) => outData.push(b, g, r)
                    break;

                case 'brg':
                    copyPixels = (r, g, b) => outData.push(b, r, g)
                    break;

                case 'grb':
                    copyPixels = (r, g, b) => outData.push(g, r, b)
                    break;

                case 'gbr':
                    copyPixels = (r, g, b) => outData.push(g, b, r)
                    break;

                default:
                    copyPixels = (r, g, b) => outData.push(r, g, b)
                    break;
            }

            console.log(imageOptions)

            for (let i = 0; i < imageData.data.length; i = i + 4) {
                copyPixels(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2])
            }

            //console.log(outData)
            data(outData)

        }
    }, [file, format, data, imageOptions])

    if (file === null && file === undefined) return <div />

    return (
        <div>
            <div style={{ marginLeft: '10px' }} >
                <canvas ref={canvasRef} width={file.width} height={file.height} />
            </div>
            <div style={{ marginLeft: '10px' }}>
                <img style={{ width: '100%' }} src={`atom://${file.name}`} alt={file.name} />
            </div>
        </div>
    )
}
