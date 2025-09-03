FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

COPY . .

# disable ESLint checks in Next.js build
ENV NEXT_DISABLE_ESLINT true

RUN npm run build

CMD ["npm", "start"]
