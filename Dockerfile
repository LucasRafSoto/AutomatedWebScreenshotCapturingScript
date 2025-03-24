# Use Playwright's official base image
FROM node:20

# Install Google Chrome
RUN apt-get update && apt-get install -y wget gnupg
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
RUN apt-get update && apt-get install -y google-chrome-stable

# Install Xvfb and other necessary libraries
RUN apt-get update && apt-get install -y \
    xvfb \
    libnss3 \
    libx11-xcb1 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory and install packages
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npx playwright install-deps
COPY . .
RUN npx playwright install
RUN npx tsc

# Set command to run the application with Xvfb
CMD ["xvfb-run", "--server-args=-screen 0 1920x1080x24", "node", "dist/main.js"]

# docker build -t asc-playwright-app .

# docker run -it --rm \
#    -v "/Users/{Username}/Desktop:/app/desktop" \
#    -v "/Users/{Username}/Desktop/input_urls:/app/desktop/input_urls" \
#    -v "/Users/{Username}/Desktop/output_files:/app/desktop/output_files" \
#    asc-playwright-app /bin/bash

# xvfb-run --server-args="-screen 0 1920x1080x24" node dist/main.js true active.txt
