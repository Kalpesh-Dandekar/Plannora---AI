# Plannora — Adaptive AI Study Planner

> **Your study plan. Smarter every day.**

Plannora is a full-stack adaptive study planning platform designed to create realistic, personalized study schedules that continuously adjust as a student's situation changes.

Unlike a static timetable generator, Plannora considers **exam urgency, topic difficulty, preparation level, available study time, missed sessions, and student feedback** to continuously prioritize and reorganize study work.

**Core idea:** A study planner that survives real life.

**Plan → Study → Feedback → Adapt → Repeat**

---

## Live Demo

**Application:** https://plannora-ai.vercel.app/

**Backend API:** https://plannora-api-4lm4.onrender.com

> The backend is hosted on Render's free tier and may require a short cold-start period after inactivity.

---

## Why Plannora?

Traditional study planners usually generate a timetable once and expect students to follow it perfectly.

Real study schedules rarely work that way.

Students:

- miss study sessions
- underestimate difficult topics
- have different amounts of free time each day
- need different strategies for different subjects
- become more time-constrained as exams approach

Plannora treats the study plan as a **dynamic system rather than a fixed calendar**.

It continuously combines deterministic scheduling logic with AI-powered study intelligence to help students decide:

- **What should I study next?**
- **Why is this topic important right now?**
- **What happens if I miss a session?**
- **How should I study this topic?**
- **What should I do if I suddenly have less time?**
- **How prepared am I for my exam?**

---

## Key Features

### Personalized Study Plan Generator

Students configure:

- regular study or exam preparation mode
- subjects and topics
- topic difficulty
- current preparation level
- exam dates
- daily availability
- preferred session duration
- study goals

Plannora converts this information into a structured study schedule.

### Smart Priority Engine

Topics are ranked using deterministic factors including:

- exam urgency
- topic difficulty
- preparation level
- additional attention requirements

This ensures that important and weak topics receive attention before lower-priority work.

### Daily & Weekly Planning

Students can switch between focused daily planning and a broader weekly timetable.

Each session clearly shows:

- topic
- subject
- scheduled time
- duration
- priority context

### Adaptive Study Engine

After a session, students can record its status as:

- **Done**
- **Partial**
- **Missed**

They can also provide difficulty feedback:

- **Easy**
- **Okay**
- **Difficult**

The planner uses this feedback to adjust future priorities.

For example, a partially completed session that was marked difficult receives a stronger priority increase than a successfully completed easy session.

### Automatic Rescheduling

Missed and incomplete work is not simply discarded.

Plannora redistributes unfinished work into future available study periods while respecting the student's configured schedule.

### Rescue My Plan

When a student's schedule falls behind, **Rescue My Plan** helps recover the study plan by reorganizing pending work around remaining availability and priorities.

### I Only Have X Minutes

Students can enter the amount of time they currently have available.

Plannora produces a focused short-term plan based on the highest-value work that fits within that time.

This replanning is temporary and does not unnecessarily mutate the student's primary schedule.

### Why This?

Every scheduled topic can provide a contextual explanation for why it currently deserves attention.

The explanation combines actual planning information such as:

- topic difficulty
- preparation state
- exam proximity
- priority score
- attention requirements

This makes the planner's decisions easier to understand instead of presenting an unexplained timetable.

### Exam Preparation

Exam mode provides:

- exam countdown
- remaining workload
- syllabus progress
- topic priorities
- readiness score
- AI-assisted exam strategy

### Progress & Study Insights

The progress workspace provides visibility into:

- planned vs. completed study time
- completion rate
- study streak
- subject progress
- preparation state
- weak areas
- useful study patterns

### Focus Mode

A dedicated focus workspace helps students execute the plan rather than only organize it.

---

# Gemini-Powered Study Intelligence

Plannora integrates the **Gemini API** as an intelligence layer on top of its deterministic planning engine.

AI is used where personalized reasoning and explanation provide value.

## AI Study Strategy

Generates contextual recommendations for how a student should approach their current study work.

Possible strategies include:

- concept learning
- practice
- revision
- active recall

## AI Priority Explanation

Enhances the **Why This?** experience with a concise explanation of why a particular topic deserves attention and what the student should accomplish during the session.

## AI Recovery Coach

Provides useful guidance when the student's plan has fallen behind and helps explain how to recover effectively.

## AI Exam Strategy

Uses the student's actual exam context, remaining time, readiness, and topic state to provide focused exam-preparation guidance.

## AI Study Insights

Interprets progress information to surface useful observations, strengths, and areas that deserve additional attention.

---

## AI Safety & Reliability

Gemini does **not** directly control Plannora's scheduling engine.

Core planning decisions remain deterministic.

The AI layer receives compact, relevant study context and returns structured output that is validated before being used by the application.

If the AI provider is unavailable, exceeds quota, or returns an invalid response, Plannora uses deterministic fallback responses so that the core product remains usable.

This separation keeps AI helpful without making the application's essential planning behavior dependent on unpredictable model output.

---

# How the Planning Engine Works

A simplified Plannora workflow:

```text
Student Setup
     │
     ▼
Subjects + Topics + Availability + Exams
     │
     ▼
Priority Engine
     │
     ├── Exam Urgency
     ├── Topic Difficulty
     ├── Preparation Level
     └── Attention Requirements
     │
     ▼
Study Plan Generator
     │
     ▼
Daily / Weekly Schedule
     │
     ▼
Student Studies
     │
     ▼
Session Feedback
(Done / Partial / Missed)
(Easy / Okay / Difficult)
     │
     ▼
Adaptive Priority Update
     │
     ▼
Rescheduling / Recovery
     │
     └──────────────► Updated Study Plan
```

The resulting cycle is:

```text
PLAN → STUDY → FEEDBACK → ADAPT → REPEAT
```

---

# System Architecture

```text
┌───────────────────────────────┐
│         Next.js Client        │
│                               │
│ Dashboard • Plan • Subjects   │
│ Exams • Progress • Focus      │
└──────────────┬────────────────┘
               │
               │ REST API
               ▼
┌───────────────────────────────┐
│     Node.js + Express API     │
│                               │
│ Authentication                │
│ Planner / Priority Engine     │
│ Adaptive Scheduling           │
│ Progress & Readiness          │
│ AI Intelligence Layer         │
└─────────┬───────────┬─────────┘
          │           │
          ▼           ▼
┌────────────────┐  ┌────────────────┐
│ MongoDB Atlas  │  │   Gemini API   │
│                │  │                │
│ Users          │  │ Strategies     │
│ Profiles       │  │ Explanations   │
│ Study Plans    │  │ Insights       │
└────────────────┘  └────────────────┘
```

---

# Tech Stack

## Frontend

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**

## Backend

- **Node.js**
- **Express**
- **TypeScript**
- **Mongoose**

## Database

- **MongoDB Atlas**

## Artificial Intelligence

- **Google Gemini API**

## Authentication

- JWT-based authentication

## Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

---

# Application Areas

Plannora provides dedicated workspaces for:

| Area | Purpose |
|---|---|
| **Today** | Current study progress and upcoming work |
| **My Plan** | Daily and weekly study schedule |
| **Subjects** | Subject and topic-level preparation state |
| **Exams** | Exam countdown, readiness and preparation strategy |
| **Progress** | Completion metrics and study insights |
| **Focus** | Focused study-session execution |
| **Settings** | Account and planner configuration |

---

# Backend API

The backend exposes REST APIs for authentication, planning, progress tracking, adaptive scheduling and AI intelligence.

### Core APIs

```text
GET    /api/dashboard
GET    /api/subjects
GET    /api/exams
GET    /api/progress

GET    /api/study-plan
POST   /api/study-plan/generate
POST   /api/study-plan/rescue
POST   /api/study-plan/quick-replan

PATCH  /api/sessions/:sessionId
```

### AI APIs

```text
POST   /api/ai/study-strategy
POST   /api/ai/why-this
POST   /api/ai/recovery-coach
GET    /api/ai/exam-strategy
GET    /api/ai/insights
```

Protected routes use authenticated user context to maintain user isolation.

---

# Project Structure

```text
Plannora---AI/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   │   └── ai/
│   │   ├── app.ts
│   │   └── server.ts
│   └── package.json
│
└── README.md
```

---

# Running Locally

## 1. Clone the repository

```bash
git clone https://github.com/Kalpesh-Dandekar/Plannora---AI.git
cd Plannora---AI
```

## 2. Backend

```bash
cd backend
npm install
```

Create:

```text
backend/.env
```

Example configuration:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Run:

```bash
npm run dev
```

The backend runs locally on:

```text
http://localhost:5000
```

## 3. Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create:

```text
frontend/.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Design Decisions

### Deterministic Scheduling + AI Assistance

Scheduling is deterministic because students need predictable and explainable plans.

AI is used for interpretation, strategy and personalized guidance rather than being given unrestricted control over scheduling.

### Explainable Priorities

Instead of simply ranking topics, Plannora exposes the reasoning behind priority decisions through **Why This?**

### Failure-Tolerant AI

The core application continues functioning even when Gemini is unavailable because AI features have deterministic fallback behavior.

### Adaptive Instead of Static

Session outcomes affect future priorities, allowing the plan to evolve with the student's actual progress.

### Realistic Availability

Plans are generated around the student's available hours instead of assuming identical study time every day.

---

# Security

Plannora follows several basic security principles:

- Gemini API credentials remain server-side
- environment secrets are excluded from source control
- protected endpoints require authentication
- study data is scoped to the authenticated user
- AI input is constructed from controlled application context
- structured AI responses are validated before use
- no arbitrary user prompt is directly executed as application logic

---

# Deployment

The application is deployed using separate frontend and backend services:

```text
Browser
   │
   ▼
Vercel
Next.js Frontend
   │
   │ HTTPS / REST
   ▼
Render
Express Backend
   │
   ├────────► MongoDB Atlas
   │
   └────────► Gemini API
```

**Production Application:**  
https://plannora-ai.vercel.app/

---

# Future Improvements

Potential extensions include:

- calendar synchronization
- notifications and reminders
- richer study analytics
- spaced-repetition scheduling
- collaborative study plans
- additional focus-session analytics
- more granular revision planning

These are intentionally outside the current core implementation so the product remains focused on reliable adaptive study planning.

---

# About the Project

Plannora was developed as an **AI Full Stack Developer Internship preselection project**.

The goal was not simply to generate a timetable, but to explore how deterministic planning logic and generative AI can work together to create a study planner that remains useful when a student's real schedule changes.

---

## Author

**Kalpesh Dandekar**

GitHub: https://github.com/Kalpesh-Dandekar

---

<p align="center">
  <strong>Plannora</strong><br/>
  Your study plan. Smarter every day.
</p>
