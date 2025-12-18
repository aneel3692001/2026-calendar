# 2026 Tales of Wild Calendar

A premium, wildlife-themed digital calendar web application.

## Prerequisites

- Node.js (v18+)
- SQLite3

## Setup

1. **Install Dependencies**

   ```bash
   cd client
   npm install

   cd ../server
   npm install
   ```

2. **Environment Configuration**

   Copy `.env.example` to `.env` in the root (mostly for server reference, though currently server reads process envs directly or you can add `dotenv` config loading in server.js top).

   ```bash
   cp .env.example .env
   ```

3. **Database Setup**

   Initialize and seed the database with Indian Holidays and Wildlife Days for 2026.

   ```bash
   cd server
   node db/seed.js
   ```

## Running the Application

### Development (Recommended)

1. Start the Backend:

   ```bash
   cd server
   npm start
   ```

   Server runs on `http://localhost:3000`.

2. Start the Frontend:
   ```bash
   cd client
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`.

### Production

1. Build the frontend:

   ```bash
   cd client
   npm run build
   ```

2. Serve using Node (Update server logic to serve `client/dist` if needed, or use Nginx):
   Currently, the provided Docker setup handles production-like serving.

## Docker

```bash
docker-compose up --build
```

## Features

- **Month View**: Navigate the 2026 calendar.
- **Day Detail**: See events, holidays, and featured wildlife photos.
- **Submissions**: Public upload form for photographers.
- **Admin**: Basic dashboard structure for managing content.
- **Notifications**: Cron job setup for daily featured image alerts.

## Tech Stack

- **Frontend**: Vite + Vanilla JS + CSS System (No Frameworks)
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Styling**: Custom "Wildlife Lux" CSS variables + Glassmorphism.
