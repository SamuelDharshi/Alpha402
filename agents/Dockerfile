FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY agents/package*.json agents/
COPY bot/package*.json bot/
COPY contracts/package*.json contracts/
COPY shared/package*.json shared/

RUN npm install

COPY . .

RUN npm run build --workspace=shared && npm run build --workspace=agents

EXPOSE 3001

CMD ["npm", "run", "start", "--workspace=agents"]