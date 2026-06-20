FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npx tsc

# Cloud Run sets the PORT env var
ENV PORT=3000
EXPOSE 3000

# Start the compiled Node.js app
CMD ["node", "dist/index.js"]
