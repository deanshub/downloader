FROM node:16

WORKDIR /app

ADD package.json /app/
ADD .yarn /app/.yarn
ADD yarn.lock /app/

RUN yarn --frozen-lockfile
COPY . /app

RUN yarn build

CMD ["yarn", "start"]
