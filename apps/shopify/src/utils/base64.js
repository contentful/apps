export const atob = (str) => {
    try {
        const decodedId = window.atob(str)
        return decodedId
    } catch (error) {
        return null
    }
}


export const btoa = (str) => {
    try {
        const decodedId = window.btoa(str)
        return decodedId
    } catch (error) {
        return null
    }
}


export const checkAndConvertToBase64 = (res) => {
    return { ...res, id: !isBase64(res.id) ? btoa(res.id) : res.id }
}

export const isBase64 = (str) => {

    if (str === '' || str.trim() === '') { return false; }
    try {
        return window.btoa(window.atob(str)) === str;
    } catch (err) {
        return false;
    }
}