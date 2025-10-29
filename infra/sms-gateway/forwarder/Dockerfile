FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
# npm ci requires a lockfile, which this package does not ship. Use npm install
# with production-only dependencies so the image build succeeds without a
# package-lock.json.
RUN npm install --omit=dev

# Copy application code
COPY index.ts ./
COPY tsconfig.json ./

# Install TypeScript and build
RUN npm install -g typescript && \
    tsc && \
    npm uninstall -g typescript

# Run the forwarder
CMD ["node", "dist/index.js"]
