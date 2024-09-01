FROM node:22

RUN corepack enable

WORKDIR /app

# Copy only package.json and pnpm-lock.yaml first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm build

# Set the default command
CMD ["pnpm", "start"]
