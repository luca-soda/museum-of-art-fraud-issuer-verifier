FROM --platform=linux/amd64 node:18-alpine

COPY . .

# RUN yarn --frozen-lockfile

RUN yarn build

EXPOSE 3000

CMD [ "yarn", "start"]