FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY index.ts ./
COPY tsconfig.json ./

# Install TypeScript and build
RUN npm install -g typescript && \
    tsc && \
    npm uninstall -g typescript

# Run the forwarder
CMD ["node", "dist/index.js"]
