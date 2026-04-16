FROM node:20-slim

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # yt-dlp
    python3 curl ca-certificates \
    # ffmpeg
    ffmpeg \
    # canvas (node-canvas native deps)
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    pkg-config \
    build-essential \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
         -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install

EXPOSE 3000
CMD ["npm", "run", "dev"]
