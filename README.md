# Catalog Search Application

A full-stack application for uploading and searching product catalogs with Elasticsearch integration.

## Prerequisites

- Docker
- Docker Compose

## Getting Started

1. Clone the repository
2. Run the application:

```bash
docker-compose up --build
```

The application will be available at http://localhost:3000

## Services

- **Web Application & API**: Running on port 3000
- **Elasticsearch**: Running on port 9200

## Usage

1. Upload a JSON catalog file using the web interface
2. Search through products using the search bar
3. Results are sorted by relevance when searching

## Data Persistence

- Elasticsearch data is persisted in a Docker volume
- Uploaded catalogs are stored in the `server/uploads` directory

## Development

To run the application in development mode:

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```# catalog-elasticsearch
