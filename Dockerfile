FROM node:16

WORKDIR /app

ADD package.json /app/
ADD yarn.lock /app/

RUN yarn --frozen-lockfile
COPY . /app

RUN yarn build

CMD ["yarn", "start"]
