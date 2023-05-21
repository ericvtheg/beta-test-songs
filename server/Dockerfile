# File based on: https://www.tomray.dev/nestjs-docker-production

###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:19.4.0-alpine As development

# Create app directory
WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm@7.27.0

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running pnpm install on every code change.
COPY --chown=node:node package*.json ./
COPY --chown=node:node pnpm-lock.yaml ./

# Installing python since it's a node-gyp dependency
RUN apk add g++ make py3-pip && rm -rf /var/cache/apk/*

# Install app dependencies using the `pnpm install --frozen-lockfile` command instead of `pnpm install`
RUN pnpm install --frozen-lockfile

# Bundle app source
COPY --chown=node:node . .

# Use the node user from the image (instead of the root user)
USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:19.4.0-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node pnpm-lock.yaml ./

# In order to run `pnpm run build` we need access to the Nest CLI which is a dev dependency. 
# In the previous development stage we ran `pnpm install --frozen-lockfile` which installed all dependencies, 
# so we can copy over the node_modules directory from the development image
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

# Run the build command which creates the production bundle
RUN npm install -g pnpm@7.27.0
RUN pnpm run build

# Installing python since it's a node-gyp dependency
RUN apk add g++ make py3-pip && rm -rf /var/cache/apk/*

USER node

###################
# PRODUCTION
###################

FROM node:19.4.0-alpine As production

# Set NODE_ENV environment variable
ENV NODE_ENV production

COPY --chown=node:node --from=build /usr/src/app/package*.json ./
COPY --chown=node:node --from=build /usr/src/app/pnpm-lock.yaml ./
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node prisma ./prisma

EXPOSE 8080

# Start the server using the production build
RUN npm install -g pnpm@7.27.0
RUN npm install -g prisma
CMD pnpm run start:prod