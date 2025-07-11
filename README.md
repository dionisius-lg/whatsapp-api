# Whatsapp API

## Node Version

`18.20.7`

## Technologies

1. [expressjs](https://expressjs.com) 4.19.2
2. [db-migrate](https://db-migrate.readthedocs.io) 0.11.14
3. [mysql2](https://github.com/sidorares/node-mysql2) 3.10.3

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Migration](#migration)

## Installation

To get started with the Whatsapp API, clone the repository and install the required dependencies in `package.json`:
```bash
git clone https://github.com/dionisius-lg/whatsapp-api.git
cd whatsapp-api
npm install
```

## Configuration

Rename or copy `.env.example` to `.env`, then setup the 'datasources' for your application.

## Migration

To apply new migration
```sh
npx db-migrate up
```

To cancel all migration
```sh
npx db-migrate down
```