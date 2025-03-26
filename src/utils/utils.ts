import path from 'path';
import {VIEWPORT_SELECTOR} from './capture_screenshot';
import {isUrlDownloadablePDF} from './download';
import {Page} from 'playwright';

const MAX_FILENAME_LENGTH = 255;
const EXT_LENGTH = 4;

export enum FileType {
    Attachment,
    PDF,
    Download,
    Youtube,
    ViewportChange,
    PDFDefault,
}

export async function getFilePath(
    url: string,
    folderPath: string,
    index: number,
) {
    let filename = `${index}-${url
        .replace(/https?:\/\//, '')
        .replace(/\//g, '_')}.pdf`;
    if (filename.length > MAX_FILENAME_LENGTH) {
        filename = filename.substring(0, MAX_FILENAME_LENGTH - EXT_LENGTH) + '.pdf';
    }
    return path.join(folderPath, filename);
}

export function shouldSkipUrl(
    url: string,
    isDocker: boolean,
    fileIndex: number,
    indexesToProcess?: number[],
    domainToProcess?: string,
): boolean {
    if (
        indexesToProcess != null &&
        indexesToProcess.length > 0 &&
        !indexesToProcess.includes(fileIndex)
    ) {
        return true;
    }

    if (domainToProcess != null && !url.includes(domainToProcess)) {
        return true;
    }

    return (
        (url.includes('google.com') && isDocker) ||
        (!url.includes('google.com') && !isDocker)
    );
}

export async function getFileType(
    url: string,
    page: Page,
    index: number,
): Promise<FileType> {
    if (await isUrlDownloadablePDF(url, page, index)) {
        return FileType.PDF;
    } else if (
        url.includes('/attachment/?id=') ||
        url.includes('/attachment/download/?id=') ||
        url.includes('www.facebook.com/gms_hub/share/')
    ) {
        return FileType.Attachment;
    } else if (url.includes('/download/')) {
        return FileType.Download;
    } else if (url.includes('youtube.com')) {
        return FileType.Youtube;
    } else if (Object.keys(VIEWPORT_SELECTOR).find(key => url.includes(key))) {
        return FileType.ViewportChange;
    }
    return FileType.PDFDefault;
}
