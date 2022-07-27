import btoa from './btoa'
import isBase64 from './isBase64'

export default function checkAndConvertToBase64(res) {
    return { ...res, id: !isBase64(res.id) ? btoa(res.id) : res.id }
}