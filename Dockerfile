# Use official Node.js image
FROM node:20-slim

# Install OpenSSL and other dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy Prisma schema and configuration files
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Hugging Face Spaces default port is 7860
ENV PORT=7860
EXPOSE 7860

# Command to start the backend server
CMD ["node", "server.js"]
