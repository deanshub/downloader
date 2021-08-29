ARG NODE_IMAGE=arm32v7/node
FROM ${NODE_IMAGE}

WORKDIR /app

ADD package.json /app/
ADD yarn.lock /app/

RUN yarn --frozen-lockfile
COPY . /app

RUN yarn build

CMD ["yarn", "start"]
