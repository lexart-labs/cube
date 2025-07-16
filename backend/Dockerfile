FROM node:18

RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /backend

COPY package*.json ./
RUN npm i && npm cache clean --force

COPY config/ ./config/
COPY routes/ ./routes/
COPY services/ ./services/
COPY queries/ ./queries/
COPY server.js ./
COPY app.js ./

RUN chown -R appuser:appuser /backend
USER appuser

CMD ["npm", "start"]
