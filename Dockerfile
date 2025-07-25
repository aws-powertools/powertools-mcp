FROM public.ecr.aws/amazonlinux/amazonlinux:2023-minimal AS builder

RUN curl -fsSL https://rpm.nodesource.com/setup_24.x | bash -

RUN dnf install nodejs -y

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .

RUN npm ci

COPY src/ ./src/

RUN npm run build

FROM public.ecr.aws/amazonlinux/amazonlinux:2023-minimal

RUN dnf install -y shadow-utils

RUN curl -fsSL https://rpm.nodesource.com/setup_24.x | bash -

RUN dnf install nodejs -y

WORKDIR /app

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist/ ./dist/

RUN npm ci --omit=dev && npm cache clean --force

RUN chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production

ENTRYPOINT ["node", "dist/index.js"]