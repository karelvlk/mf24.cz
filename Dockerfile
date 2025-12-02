# Use official Bun image
FROM oven/bun:1 as base
WORKDIR /app

# 1. Install dependencies
COPY package.json bun.lockb ./
RUN bun install

# 2. Copy source code
COPY . .

# 3. Build application
RUN bun run build

# 4. Prepare for execution
# Create data directory to ensure it exists
RUN mkdir -p data-records

# Expose the port where Vite preview runs (default 4173, but configured to 8080)
EXPOSE 8080

# Run application in preview mode
CMD ["bun", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8080"]
