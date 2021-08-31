export function stripHtml(html: string): string {
    return html.replace(/\</g, '&lt;').replace(/\>/g, '&gt;')
}
