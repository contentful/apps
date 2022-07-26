export default function atob(str) {
    try {
        const unencodedId = window.atob(str)
        return unencodedId
    } catch (error) {
        return null
    }
}