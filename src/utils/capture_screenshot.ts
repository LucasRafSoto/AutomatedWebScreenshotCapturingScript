import {Page} from 'playwright';
import {matchingSelector} from './selector';
import {closePopup} from './close_popup';

export const VIEWPORT_SELECTOR: {[key: string]: string} = {
    'docs.google.com':
        'div[class="kix-rotatingtilemanager docs-ui-hit-region-surface"]',
    '/tasks/':
        'span[data-surface="/tasks/task_details"] div[class="x78zum5 xdt5ytf x1iyjqo2 x1n2onr6"]',
    'www.instagram.com/':
        'div[class="x9f619 xjbqb8w x78zum5 x168nmei x13lgxp2 x5pf9jr xo71vjh xq1608w xijc0j3 x1uhb9sk x1plvlek xryxfnj x1c4vz4f x2lah0s xdt5ytf xqjyukv x1qjc9v5 xamitd3 x1nhvcw1"]',
    'evidence_manager/mitigations': 'div[class="_7ji6"]',
    '/cms/editor/': 'div[class="CodeMirror-sizer"]',
};
const FALLBACK_VIEWPORT_SELECTOR: {[key: string]: string} = {
    'evidence_manager/mitigations': 'div[class="x1d52u69"]',
    '/cms/editor/': 'div[dir="ltr"]',
};

export async function captureScreenshotForURLMatches(
    page: Page,
    url: string,
    filepath: string,
    index: number,
) {
    const filename = filepath.replace('.pdf', '.png');

    // navigate to the URL and allow for loading
    await page.goto(url, {waitUntil: 'load', timeout: 10000});
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    // handle edge cases
    await closePopup(page, url);

    // get the viewport selector
    const [viewportSelector, fallbackViewportSelector] = await Promise.all([
        matchingSelector(page, url, VIEWPORT_SELECTOR),
        matchingSelector(page, url, FALLBACK_VIEWPORT_SELECTOR),
    ]);

    if (!viewportSelector && !fallbackViewportSelector) {
        await page.screenshot({path: filename, fullPage: true});
        process.stdout.write(
            `\rCapturing screenshot despite no viewport selector found at index ${index}.\n`,
        );
        return true;
    }

    let totalHeight = 1080;

    const evaluateHeight = async (selector: string | null) => {
        if (selector) {
            const element = await page.$(selector);
            if (element) {
                await page.waitForSelector(selector, {state: 'visible'});
                return await element.evaluate(el => el.clientHeight);
            }
        }
        return 0;
    };

    const viewportHeight = await evaluateHeight(viewportSelector);
    const fallbackViewportHeight = await evaluateHeight(fallbackViewportSelector);

    totalHeight = Math.max(
        totalHeight,
        viewportHeight + 100,
        fallbackViewportHeight + 100,
    );

    await page.setViewportSize({
        width: 1920,
        height: totalHeight,
    });
    await page.screenshot({path: filename, fullPage: true});
    return true;
}

export async function captureScreenshotForYoutubePage(
    page: Page,
    url: string,
    filepath: string,
) {
    // navigate to the URL and allow for loading
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 10000});
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // resize page to get comments to load
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await page.waitForTimeout(1000);

    const filename = filepath.replace('.pdf', '.png');

    await page.screenshot({path: filename, fullPage: true});
    return true;
}
