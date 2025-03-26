import {Page} from 'playwright';
import {matchingSelector} from './selector';

const POPUP_SELECTOR: {[key: string]: string} = {
    '/evidence_manager/':
        'section[role="main"] button[data-logging-label="Close"]',
    'ca.finance.yahoo.com':
        'div[class="actions couple"] button[class="btn secondary reject-all"]',
    'nytimes.com/': 'span:text("Continue")',
    'roadtraffic-technology': 'button[id="onetrust-accept-btn-handler"]',
    'instagram-platform/sharing-to-feed': 'a[role="button"]:text("Agree")',
    'developers.facebook.com/apps/184484190795':
        'a[class="autofocus _9l2h  layerCancel _4jy0 _4jy3 _4jy1 _51sy selected _42ft"]',
    'slate.com/':
        'div[class="tp-iframe-wrapper tp-active"] button[aria-label="Close"]',
};

export async function closePopup(page: Page, url: string) {
    const popupSelector = await matchingSelector(page, url, POPUP_SELECTOR);

    if (popupSelector) {
        await page.click(popupSelector);
        await page.waitForSelector(popupSelector, {state: 'hidden'});
        await page.waitForTimeout(1000);
        await page.waitForLoadState('domcontentloaded');
    }
}