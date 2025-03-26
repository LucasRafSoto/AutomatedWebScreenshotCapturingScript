import {chromium, Page} from 'playwright';
import fs from 'fs';
import {LOCAL_CHROME_PATH, LOCAL_USER_DATA_DIR} from './main';

const DOMAINS_REQUIRING_LOGIN = [
    'www.figma.com',
    'www.instagram.com',
    'drive.google.com',
    'docs.google.com',
];

async function updateCookies() {
    console.log(`-----COPYING COOKIES-----`);

    // Login to all domains requiring login
    const browser = await chromium.launchPersistentContext(LOCAL_USER_DATA_DIR, {
        executablePath: LOCAL_CHROME_PATH,
        headless: false,
    });

    for (const domain of DOMAINS_REQUIRING_LOGIN) {
        const page: Page = await browser.newPage();
        await page.goto(`https://${domain}`);
        console.log(`Please complete the login manually for ${domain}...`);

        // Wait for the user to manually log in and capture cookies after navigation
        await new Promise<void>(resolve => {
            page.on('close', () => resolve());
        });
        console.log(`Cookies saved for ${domain}`);

        if (!page.isClosed()) {
            await page.close();
        }
    }

    const cookies = await browser.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies));

    await browser.close();
}

// LOGIN
updateCookies()
    .then(() => {
        console.log('-----COOKIES LOGGED-----');
    })
    .catch(err => console.error(`Error copying cookies: ${err}`));
