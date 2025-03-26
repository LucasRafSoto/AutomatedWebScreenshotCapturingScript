import {Page} from 'playwright';
import path from 'path';
import fs from 'fs';

const MAX_FILENAME_LENGTH = 255;

export async function downloadFile(
    page: Page,
    url: string,
    folderPath: string,
    index: number,
) {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await page.route('**/*', async route => {
        const request = route.request();
        const requestUrl = request.url();

        if (requestUrl.endsWith('.pdf')) {
            const response = await page.request.fetch(request);
            const buffer = await response.body();
            let suggestedFilename = `${index}-${path.basename(requestUrl)}`;
            if (suggestedFilename.length > MAX_FILENAME_LENGTH) {
                suggestedFilename =
                    suggestedFilename.substring(0, MAX_FILENAME_LENGTH - 4) + '.pdf';
            }
            const filePath = path.join(folderPath, suggestedFilename);
            fs.writeFileSync(filePath, buffer);
            await route.fulfill({
                response,
            });
        } else {
            route.continue();
        }
    });

    await page.goto(url);
    return true;
}

export async function downloadAttachment(
    page: Page,
    url: string,
    folderPath: string,
    index: number,
) {
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.evaluate(url => {
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = '';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
        }, url),
    ]);

    let suggestedFilename = `${index}-${download.suggestedFilename()}`;
    if (suggestedFilename.length > MAX_FILENAME_LENGTH) {
        suggestedFilename =
            suggestedFilename.substring(0, MAX_FILENAME_LENGTH - 4) + '.pdf';
    }
    const filePath = path.join(folderPath, suggestedFilename);
    await download.saveAs(filePath);
    return true;
}

export async function isUrlDownloadablePDF(
    url: string,
    page: Page,
    index: number,
): Promise<boolean> {
    try {
        const response = await page.request.head(url, {timeout: 10000});
        const contentType = response.headers()['content-type'];

        if (contentType && contentType.includes('application/pdf')) {
            return true;
        }
    } catch (error) {
        process.stdout.write(
            `\rFailed to check content type at index ${index}. Defined URL as not a downloadable PDF\n`,
        );
    }

    return false;
}