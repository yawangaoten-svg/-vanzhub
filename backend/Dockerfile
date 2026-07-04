FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++ openssl

FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production
RUN cp -R node_modules /prod_node_modules
RUN npm ci

FROM dependencies AS development
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

FROM base AS production
COPY --from=dependencies /prod_node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/index.js"]
