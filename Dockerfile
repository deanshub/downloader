FROM node:22

RUN corepack enable

WORKDIR /app

ADD package.json /app/
ADD pnpm-lock.yaml /app/

RUN pnpm install --frozen-lockfile
COPY . /app

RUN pnpm build

CMD ["pnpm", "start"]
