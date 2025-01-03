export function stripHtml(html: string | undefined): string {
    return (html ?? '')
        .replace(/\</g, '&lt;')
        .replace(/\>/g, '&gt;')
        .replace(/\&/g, '&amp;')
        .replace(/\"/g, '&quot;')
        .replace(/\'/g, '&#039;')
}
