import {Page} from 'playwright';
import {closePopup} from './close_popup';
import {matchingSelector} from './selector';

const TIMEOUT_SELECTOR: {[key: string]: string} = {
    '/diffusion/': 'div[class="view-lines monaco-mouse-cursor-text"]',
    'bbc.co.uk/news/technology-47255380':
        'h1:text("Facebook needs regulation as Zuckerberg \'fails\' - UK MPs")',
};

export async function capturePDF(page: Page, url: string, filePath: string) {
    // navigate to the URL and allow for loading
    await page.goto(url, {waitUntil: 'load', timeout: 10000});
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    // handle edge cases
    await closePopup(page, url);

    // wait for selector to appear
    await matchingSelector(page, url, TIMEOUT_SELECTOR);

    // capture PDF
    await page.pdf({
        path: filePath,
        width: '1920px',
        height: '1080px',
        printBackground: true,
    });

    return true;
}

export async function capturePdfOnError(
    page: Page,
    url: string,
    filePath: string,
    error: unknown,
    index: number,
) {
    process.stdout.write(`\r---Error at index: ${index} for ${url}---`);

    if (error instanceof Error) {
        const isHandlableError = [
            'TimeoutError',
            'Timeout',
            'net::ERR_HTTP_RESPONSE_CODE_FAILURE',
            'net::ERR_NAME_NOT_RESOLVED',
            'net::ERR_CERT_COMMON_NAME_INVALID',
        ].some(keyword => error.message.includes(keyword));

        if (isHandlableError) {
            await page.waitForTimeout(1500);

            // capture PDF despite error
            try {
                await page.pdf({
                    path: filePath,
                    width: '1920px',
                    height: '1080px',
                    printBackground: true,
                });
                console.log('PDF captured despite error');
                return true;
            } catch (pdfError) {
                console.error('Failed to capture PDF:', pdfError);
            }
        }
    }

    console.log('--------------------\n');
    return false;
}
