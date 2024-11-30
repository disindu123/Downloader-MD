# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json into the container
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose a port (optional, for debugging or API integration if needed)
EXPOSE 3000

# Define the command to run the bot
CMD ["node", "index.js"]
