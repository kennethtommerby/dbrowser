FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
ARG CACHEBUST=1
RUN echo "build $CACHEBUST" > /dev/null && npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY backend/package*.json ./
ARG CACHEBUST=1
RUN echo "build $CACHEBUST" > /dev/null && npm ci
COPY backend/ ./
COPY --from=frontend-build /app/dist ./dist
EXPOSE 3000
CMD ["node", "index.js"]
