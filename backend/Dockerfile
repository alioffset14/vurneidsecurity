# ----------------------------
# Stage 0: deps (npm production modules)
# ----------------------------
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# ----------------------------
# Stage 1: dalfox build (golang)
# ----------------------------
# NOTE: pin versi jika ingin reproducible build (mis. v2.8.0)
FROM golang:1.23-alpine AS dalfox-build
RUN apk add --no-cache ca-certificates
# gunakan versi ter-pin jika mungkin: go install github.com/hahwul/dalfox/v2@v2.8.0
RUN go install github.com/hahwul/dalfox/v2@latest

# ----------------------------
# Stage 2: runner (final)
# ----------------------------
FROM node:18-alpine AS runner
WORKDIR /app

# Install runtime system deps (digabung untuk mengurangi layer)
RUN apk add --no-cache \
      python3 \
      py3-pip \
      py3-setuptools \
      py3-wheel \
      git \
      curl \
      unzip \
      ca-certificates \
      bash \
      procps

# Copy dalfox binary from builder
COPY --from=dalfox-build --chmod=+x /go/bin/dalfox /usr/local/bin/dalfox

# Clone sqlmap repo (shallow)
RUN git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git /opt/sqlmap \
    && chmod -R a+rX /opt/sqlmap

# Create non-root user early
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production node_modules from deps stage (leveraging cache)
COPY --from=deps /app/node_modules ./node_modules

# Copy uploads (static user-generated files) dengan ownership yang benar
# Pastikan folder uploads ada di context build (./backend/uploads)
COPY --chown=appuser:appgroup uploads /app/uploads

# Pastikan folder-folder dinamis ada dan dimiliki oleh appuser
RUN mkdir -p /app/output /app/scans \
    && chown -R appuser:appgroup /app/output /app/scans /app/uploads /app

# Copy sisa source dan set ownership ke appuser agar runtime tidak pakai root
COPY --chown=appuser:appgroup . .

# Conditionally create virtualenv & install sqlmap requirements if present
RUN if [ -f /opt/sqlmap/requirements.txt ]; then \
      apk add --no-cache --virtual .build-deps build-base gcc make libffi-dev openssl-dev musl-dev linux-headers && \
      python3 -m venv /opt/sqlmap-venv && \
      /opt/sqlmap-venv/bin/pip install --no-cache-dir -r /opt/sqlmap/requirements.txt && \
      apk del .build-deps && \
      printf '#!/bin/sh\n. /opt/sqlmap-venv/bin/activate\npython /opt/sqlmap/sqlmap.py "$@"\n' > /usr/local/bin/sqlmap-venv && \
      chmod +x /usr/local/bin/sqlmap-venv && ln -sf /usr/local/bin/sqlmap-venv /usr/local/bin/sqlmap ; \
    else \
      printf '#!/bin/sh\npython3 /opt/sqlmap/sqlmap.py "$@"\n' > /usr/local/bin/sqlmap && \
      chmod +x /usr/local/bin/sqlmap ; \
    fi

# Default envs (samakan dengan docker-compose)
ENV NODE_ENV=production
ENV PORT=3001
ENV SQLMAP_PATH=/usr/local/bin/sqlmap

# EXPOSE harus literal (Dockerfile tidak melakukan substitusi variabel di EXPOSE)
EXPOSE 3001

# switch to non-root user
USER appuser

# Healthcheck (runs as appuser)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -fsS http://localhost:3001/health || exit 1

# Final start command
CMD ["node", "server.js"]
