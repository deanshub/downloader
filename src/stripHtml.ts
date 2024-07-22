export function stripHtml(html: string|undefined): string {
    return (html??'').replace(/\</g, '&lt;').replace(/\>/g, '&gt;')
}
