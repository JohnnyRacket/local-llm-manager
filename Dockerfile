FROM ubuntu:24.04 AS base

# Avoid interactive prompts during package install
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js 22, build tools (Ubuntu 24.04 ships GCC 13)
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Build llama.cpp (CPU-only for local testing)
# GGML_NATIVE=OFF avoids host-specific SIMD issues in Docker/emulation
WORKDIR /home/node
RUN git clone --depth 1 https://github.com/ggml-org/llama.cpp.git llama.cpp \
    && cd llama.cpp \
    && cmake -B build \
       -DGGML_CUDA=OFF \
       -DGGML_NATIVE=OFF \
    && cmake --build build --config Release -j$(nproc) --target llama-server

# Copy the binary for the "CPU" instance (same binary, no need to build twice)
RUN mkdir -p llama-cpp-cpu/build/bin \
    && cp llama.cpp/build/bin/llama-server llama-cpp-cpu/build/bin/llama-server

# Set up the Next.js app
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ENV HOME=/home/node
ENV HOSTNAME=0.0.0.0

EXPOSE 3000 8080 8081

CMD ["npm", "run", "dev"]
