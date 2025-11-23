# CryptoPal - Personalized Crypto Investor Dashboard

A web application that serves as a personalized crypto investor dashboard. The app gets to know users through an onboarding quiz and shows daily AI-curated content tailored to their interests.

## Tech Stack

- **Frontend**: React.js with Vite
- **Backend**: Node.js with Express (to be implemented)
- **Database**: MongoDB (to be implemented)
- **Deployment**: Vercel (planned)

## Project Structure

```
MoveoHomeTask/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Header/
│   │   │       ├── Header.jsx
│   │   │       └── Header.css
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   │   ├── Home.jsx
│   │   │   │   └── Home.css
│   │   │   └── Auth/
│   │   │       ├── Auth.jsx
│   │   │       └── Auth.css
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v20.17.0 or higher recommended)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in the terminal).

## Features

### Current Implementation

- ✅ Home page with hero section and "Get Started" CTA button
- ✅ Shared Header component with "CryptoPal" branding
- ✅ Navigation to login/signup page
- ✅ Responsive design for mobile and desktop
- ✅ Modern UI with crypto-themed color scheme

### Planned Features

- Onboarding quiz
- User authentication (login/signup)
- AI-curated content dashboard
- Feedback system (thumbs up/down)
- Dynamic meme display
- User profile management

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

This project is part of a coding interview task.

