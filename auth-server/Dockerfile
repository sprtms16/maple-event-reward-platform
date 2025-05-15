FROM node:18-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./
# RUN npm ci --only=production # 프로덕션용
RUN yarn install --frozen-lockfile # yarn 사용 시

COPY . .

RUN yarn build

FROM node:18-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
# RUN npm ci --only=production
RUN yarn install --frozen-lockfile --production

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]
