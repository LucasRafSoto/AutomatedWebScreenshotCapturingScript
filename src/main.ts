import {chromium} from 'playwright';
import fs from 'fs';
import path from 'path';
import {downloadAttachment, downloadFile} from './utils/download';
import {capturePDF, capturePdfOnError} from './utils/capture_pdf';
import {
    captureScreenshotForURLMatches,
    captureScreenshotForYoutubePage,
} from './utils/capture_screenshot';
import {FileType, getFilePath, getFileType, shouldSkipUrl} from './utils/utils';

// Docker Paths
const DESKTOP_PATH = '/app/desktop';
const INPUT_DIRECTORY = 'input_urls';
export const OUTPUT_DIRECTORY = 'output_files';
const CHROME_PATH = '/usr/bin/google-chrome-stable';
const USER_DATA_DIR = '/chrome_user_data';

// Local Paths
export const LOCAL_DESKTOP_PATH = path.join(
    process.env.HOME || process.env.USERPROFILE || '',
    'Desktop',
);
export const LOCAL_CHROME_PATH =
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const LOCAL_USER_DATA_DIR = path.join(
    process.env.HOME || process.env.USERPROFILE || '',
    'chrome-user-data',
);

export enum FileName {
    Active = 'active.txt', // 839 files
    Archive = 'archive.txt', // 1008 files
    OffPlatform = 'off_platform.txt', // 1570 files
    Static = 'static.txt', // 1004 files
    Test = 'test.txt',
    Downloads = 'downloads.txt',
}

async function processUrls(
    isDocker: boolean,
    file: FileName,
    indexesToProcess?: number[],
    domainToProcess?: string,
) {
    const desktopPath = isDocker ? DESKTOP_PATH : LOCAL_DESKTOP_PATH;
    const userDataDir = isDocker ? USER_DATA_DIR : LOCAL_USER_DATA_DIR;
    console.log(`-----STARTING PROCESS FOR FILE: ${file}-----`);

    const inputFilename = path.join(desktopPath, INPUT_DIRECTORY, file);
    const urls = fs
        .readFileSync(inputFilename, 'utf-8')
        .split('\n')
        .map(url => url.trim())
        .filter(url => url);

    const outputPath = path.join(desktopPath, OUTPUT_DIRECTORY, file);
    const directory = path.dirname(outputPath);
    fs.mkdirSync(directory, {recursive: true});

    const browser = await chromium.launchPersistentContext(userDataDir, {
        executablePath: isDocker ? CHROME_PATH : LOCAL_CHROME_PATH,
        headless: false,
    });
    const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
    await browser.addCookies(cookies);

    const missingIndexes = [];

    for (const [index, url] of urls.entries()) {
        const fileIndex = index + 1;

        process.stdout.write(`\r${fileIndex} / ${urls.length}`);

        if (
            shouldSkipUrl(url, isDocker, fileIndex, indexesToProcess, domainToProcess)
        ) {
            continue;
        }

        const filePath = await getFilePath(url, outputPath, fileIndex);
        const page = await browser.newPage();
        const fileType = await getFileType(url, page, fileIndex);
        let captured = false;

        try {
            switch (fileType) {
                case FileType.Attachment:
                    captured = await downloadAttachment(page, url, outputPath, fileIndex);
                    break;
                case FileType.PDF:
                case FileType.Download:
                    captured = await downloadFile(page, url, outputPath, fileIndex);
                    break;
                case FileType.Youtube:
                    captured = await captureScreenshotForYoutubePage(page, url, filePath);
                    break;
                case FileType.ViewportChange:
                    captured = await captureScreenshotForURLMatches(
                        page,
                        url,
                        filePath,
                        fileIndex,
                    );
                    break;
                default:
                    captured = await capturePDF(page, url, filePath);
                    break;
            }
        } catch (error) {
            captured = await capturePdfOnError(page, url, filePath, error, fileIndex);
        }

        if (!captured) {
            missingIndexes.push(fileIndex);
        }

        await page.close();
    }

    if (missingIndexes.length > 0) {
        console.log(`\n-----MISSING INDEXES: ${missingIndexes.join(' ')}-----`);
    }
    await browser.close();
}

// Main Run
const args = process.argv.slice(2);
const isDocker = args[0] === 'true';
const fileName = args[1] as FileName;
const indexesToProcess = args.slice(2).map(Number);
processUrls(isDocker, fileName, indexesToProcess)
    .then(() => {
        console.log('\n-----PROCESS COMPLETE-----');
    })
    .catch(err => console.error(`Error during process: ${err}`));