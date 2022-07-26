export default function atob(str) {
    try {
        const decodedId = window.btoa(str)
        return decodedId
    } catch (error) {
        return null
    }
}