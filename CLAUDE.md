# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Simple Twitch Alerts is a web application that allows receiving Twitch alerts and adding them as a browser source in OBS. The project is built with Node.js and Express.js and is licensed under GPL-3.0.

## Architecture

- **Backend**: Express.js server (`src/app.ts`) serving a simple "Hello World" endpoint
- **Language**: TypeScript with Node.js
- **Port**: Application runs on port 3000
- **Build Output**: Compiled JavaScript goes to `./dist/` directory
- **Source**: All source code is in `./src/` directory

## Development Commands

The project currently has minimal npm scripts configured:

```bash
# Install dependencies
npm install

# Run tests (currently not implemented)
npm test
```

## TypeScript Configuration

The project uses modern TypeScript configuration with:
- **Target**: ESNext
- **Module**: NodeNext  
- **Strict mode**: Enabled
- **Source maps**: Enabled
- **Declaration files**: Generated
- **Root directory**: `./src`
- **Output directory**: `./dist`

Key TypeScript compiler options include:
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `verbatimModuleSyntax: true`
- `isolatedModules: true`

## Dependencies

- **Runtime**: `express@^5.1.0`
- **Development**: `@types/node@^24.1.0`

## Current State

The application is in early development with only a basic Express server setup. The main entry point (`src/app.ts`) contains a simple HTTP server that responds with "Hello World!" on the root path.

Note: The project currently lacks build scripts, linting configuration, and testing setup that would typically be added as development progresses.