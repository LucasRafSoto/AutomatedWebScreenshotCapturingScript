import {Page} from 'playwright';

export async function matchingSelector(
    page: Page,
    url: string,
    selectors: {
        [key: string]: string;
    },
) {
    const matchingKey = Object.keys(selectors).find(key => url.includes(key));
    const scrollableSelector = matchingKey ? selectors[matchingKey] : null;

    if (scrollableSelector) {
        await page.waitForLoadState('domcontentloaded');

        try {
            // allowing 5 seconds for selector to be visible, then 1 second after visibility to ensure it's been fully rendered
            // only reaches here for a some edge cases
            await page.waitForSelector(scrollableSelector, {
                state: 'visible',
                timeout: 5000,
            });
            await page.waitForTimeout(1000);
        } catch (_error) {
            return null;
        }
    }

    return scrollableSelector;
}
