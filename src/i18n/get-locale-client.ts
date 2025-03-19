export function getLocaleClient(): string {
    const locale = document.cookie
        .split('; ')
        .find(row => row.startsWith('NEXT_LOCALE='))
        ?.split('=')[1];
    return locale || 'en';
}