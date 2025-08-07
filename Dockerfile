FROM oven/bun:1

WORKDIR /app

# Copy only package.json and bun.lockb first to leverage Docker cache
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile
RUN bun pm trust --all

# Copy the rest of the application code
COPY . .

# Build the application
# RUN bun run build

# Set the default command
CMD ["bun", "run", "start"]
