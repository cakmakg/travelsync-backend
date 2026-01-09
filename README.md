# TravelSync

AI-powered hotel management and travel booking platform.

## Project Structure

```
travelsync/
├── frontend/          # React frontend application
│   ├── src/
│   └── package.json
├── server/            # Node.js/Express backend API
│   ├── src/
│   ├── docs/
│   └── package.json
└── README.md
```

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Redux Toolkit
- React Router

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- JWT Authentication
- Redis (caching)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Redis (optional)

### Backend Setup

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Documentation

- [Backend API Documentation](./server/docs/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Development Roadmap](./server/docs/ROADMAP.md)

## License

MIT
