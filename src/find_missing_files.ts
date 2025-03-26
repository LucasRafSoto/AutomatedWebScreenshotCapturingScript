import fs from 'fs';
import path from 'path';
import {FileName, LOCAL_DESKTOP_PATH, OUTPUT_DIRECTORY} from './main';

const fileCountMap: Record<FileName, number> = {
    [FileName.Active]: 839,
    [FileName.Archive]: 1008,
    [FileName.OffPlatform]: 1570,
    [FileName.Static]: 1004,
    [FileName.Test]: 0, // No file count provided
    [FileName.Downloads]: 0, // No file count provided
};

async function findMissingFiles() {
    const folderPath = FileName.OffPlatform;
    const expectedCount = fileCountMap[folderPath];

    // Read all files in the directory
    const updatedFolderPath = path.join(
        LOCAL_DESKTOP_PATH,
        OUTPUT_DIRECTORY,
        folderPath,
    );
    const files = fs.readdirSync(updatedFolderPath);

    // Extract numbers from file names
    const numbers = files
        .map(file => parseInt(file.split('_')[0], 10))
        .filter(num => !isNaN(num));

    // Sort numbers
    numbers.sort((a, b) => a - b);

    // Find missing numbers
    let missingNumbers = 'MISSING NUMBERS--';
    for (let i = 1; i <= expectedCount; i++) {
        if (!numbers.includes(i)) {
            missingNumbers += ' ' + i.toString();
        }
    }

    if (missingNumbers === 'MISSING NUMBERS--') {
        console.log('No missing numbers');
    } else {
        console.log(missingNumbers);
    }
}

// Main Run
findMissingFiles().catch(console.error);
