# -------- Stage 1: Build binary --------
FROM golang:1.21 AS builder

# Set working directory
WORKDIR /app

# Copy module files & download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build static binary (tidak tergantung glibc)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app .

# -------- Stage 2: Runtime image --------
FROM alpine:latest

WORKDIR /app

# Copy binary hasil build
COPY --from=builder /app/app .

# Expose port default
EXPOSE 8080

# Run binary
CMD ["./app"]
