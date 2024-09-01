FROM node:22

WORKDIR /app

ADD package.json /app/
ADD pnpm-lock.yaml /app/

RUN pnpm install --frozen-lockfile
COPY . /app

RUN pnpm build

CMD ["pnpm", "start"]
