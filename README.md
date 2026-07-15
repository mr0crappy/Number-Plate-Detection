# Vehicle Number Plate Detection System

A B.Tech Final Year Project for automatic Indian vehicle number plate detection using OCR and image color analysis, with user authentication and personal detection history.

## Features

- Upload vehicle images (JPEG, PNG, WEBP, BMP)
- Extract number plate text using **Tesseract.js** OCR
- Validate plate against Indian MoRTH format (`XX00XX0000`)
- Detect **state** from state code (all 36 states/UTs supported)
- Identify **RTO district** code
- Detect **plate color** using image analysis (Sharp library)
- Determine **fuel type** from plate color (Electric / Petrol-CNG / Diesel)
- Identify **vehicle category** (Private / Commercial / EV / Diplomatic)
- Estimate **body type** (Car, Bus, Truck, Bike, Taxi, etc.)
- **User authentication** — signup, login, JWT sessions
- **Personal history** — every scan is saved per user, viewable and deletable

## Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Frontend    | React 18 + Vite               |
| Backend     | Node.js + Express             |
| OCR         | Tesseract.js v5               |
| Color Detect| Sharp                         |
| Upload      | Multer                        |
| Auth        | JWT + bcryptjs                |
| Storage     | JSON file (users + history)   |
| HTTP Client | Axios                         |

## Project Structure

```
project/
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── context/      # Auth context (React state)
│   │   ├── components/   # Navbar, UploadZone, ResultCard
│   │   ├── pages/        # Home, Login, Signup, History, About
│   │   ├── services/     # API calls (api.js)
│   │   ├── layouts/      # MainLayout
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/               # Node.js + Express backend
│   ├── controllers/      # authController, detectionController, historyController
│   ├── routes/           # auth, detection, history
│   ├── middleware/        # auth (JWT), upload (Multer)
│   ├── models/           # userStore (JSON file CRUD)
│   ├── config/           # config.js
│   ├── data/             # users.json, history.json (auto-created)
│   ├── uploads/          # Temp uploaded files (auto-cleaned)
│   ├── server.js
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js v18 or later** (v22 recommended)
- **npm**

### 1. Run the Backend

```bash
cd server
npm install
```

Create your `.env` file:
```bash
copy .env.example .env      # Windows
cp .env.example .env        # Mac/Linux
```

`.env` contents:
```
PORT=8000
JWT_SECRET=change_this_to_a_long_random_string
```

Start the server:
```bash
npm run dev
```

The server starts on **http://localhost:8000**

### 2. Run the Frontend

Open a **new terminal**:

```bash
cd client
npm install
npm run dev
```

The app opens on **http://localhost:3000**

> The Vite dev proxy automatically forwards `/api` requests to `localhost:8000`.

## API Endpoints

| Method | Endpoint                   | Auth?    | Description                      |
|--------|----------------------------|----------|----------------------------------|
| POST   | /api/auth/signup           | No       | Create a new user account        |
| POST   | /api/auth/login            | No       | Log in and receive JWT token     |
| POST   | /api/detection/analyze     | Optional | Analyze uploaded vehicle image   |
| GET    | /api/history               | Yes      | Get current user's history       |
| DELETE | /api/history/:id           | Yes      | Delete a history entry           |
| DELETE | /api/history               | Yes      | Clear all user history           |
| GET    | /api/health                | No       | Server health check              |

## Plate Color → Vehicle Type Reference

| Plate Color | Vehicle Category   | Fuel Type     | Body Types           |
|-------------|--------------------|---------------|----------------------|
| White       | Private Vehicle    | Petrol / CNG  | Car, Bike, Scooter   |
| Yellow      | Commercial Vehicle | Diesel        | Bus, Truck, Taxi     |
| Green       | Electric Vehicle   | Electric      | Car, Bus, Auto       |
| Black       | Private Hire       | Petrol/Diesel | Car, SUV             |
| Blue        | Diplomatic         | Petrol/Diesel | Car, SUV             |

## Indian Number Plate Format

```
XX  00  XX  0000
|   |   |   |
|   |   |   └── Unique 4-digit number
|   |   └────── Series (1–3 letters)
|   └────────── RTO/District code (2 digits)
└────────────── State code (2 letters)
```

Example: **MH 12 AB 1234** → Maharashtra · District 12 · Series AB · Number 1234

## Tips for Best OCR Results

- Use a clear, well-lit photo of the number plate
- Frontal or near-frontal angle works best
- Avoid shadows, glare, or reflections on the plate
- Ensure the plate is clean and unobstructed
