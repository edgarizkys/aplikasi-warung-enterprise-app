# Stage 1: Builder - Install dependencies and build frontend (if any)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy all application source code
COPY . .

# If application includes a separate frontend build step (e.g., React, Vue), uncomment and adjust:
# RUN npm run build

# Stage 2: Runner - Create a lean production image
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only necessary files from the builder stage
# Copy node_modules
COPY --from=builder /app/node_modules ./node_modules
# Copy package.json (for potential scripts or info)
COPY --from=builder /app/package*.json ./
# Copy backend source code (assuming it's in 'src' and main entry is 'server.js')
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.js ./server.js
# Copy static assets (e.g., public folder for frontend files, images, etc.)
COPY --from=builder /app/public ./public
# If a frontend build output directory exists (e.g., 'dist' or 'build'), copy it:
# COPY --from=builder /app/dist ./dist

# Expose the port the Express app listens on
EXPOSE 3000

# Command to start the application
CMD ["node", "server.js"]