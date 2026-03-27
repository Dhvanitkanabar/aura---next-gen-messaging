# 🌌 Aura: AI-Powered Productivity Platform

**Aura** is an all-in-one productivity ecosystem designed to eliminate "context switching" and help users maintain a state of deep flow. By integrating AI-driven task management with a minimalist, high-performance interface, Aura transforms how developers and creatives manage their daily workflows.

---

## ⚠️ The Problem: "The Productivity Paradox"
Modern professionals are overwhelmed by "App Fatigue." We use one app for notes, another for tasks, and a third for AI assistance. This results in:
* **Context Switching:** Losing 20-40% of productive time moving between tabs.
* **Information Silos:** Data is scattered, making it hard to find a cohesive view of goals.
* **Mental Overload:** Traditional tools are cluttered, causing "UI anxiety" rather than helping users focus.
* **Lack of Intelligence:** Most tools are static; they store data but don't help you process or prioritize it.

## ✅ The Solution: Aura
I built **Aura** to be a "Digital Brain" that handles the organization so you can handle the execution:
* **Unified Workspace:** A single, cohesive environment for tasks, notes, and AI interaction.
* **AI-First Workflow:** Integrated AI assistants that help break down complex goals into actionable sub-tasks.
* **Minimalist "Flow" UI:** Designed with a "Zero-Distraction" philosophy, using subtle animations and a clean dark-mode aesthetic.
* **Real-Time Synergy:** Instant synchronization across modules to ensure your "Aura" is always up to date.

---

## ✨ Key Features
* **Smart Task Orchestrator:** AI-assisted prioritization based on deadlines and task complexity.
* **Aura AI Chat:** A dedicated sidebar assistant for brainstorming and quick code snippets.
* **Focus Mode:** A specialized UI state that hides non-essential elements to maximize deep work.
* **Dynamic Analytics:** Visualizes your productivity trends to help you understand your peak performance hours.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React.js (Vite) |
| **Styling** | Tailwind CSS / Framer Motion (for "Flow" animations) |
| **AI Integration** | OpenAI API / Google Gemini API |
| **Backend/DB** | Firebase (Real-time Firestore & Auth) |
| **State Mgmt** | React Context API |

---

## 📂 Architecture
```text
aura-productivity/
├── src/
│   ├── components/       # AI Chatbot, Task List, Focus Timer
│   ├── context/          # User preferences and Global AI state
│   ├── hooks/            # Custom hooks for AI processing
│   ├── utils/            # Time-tracking & Task sorting algorithms
│   └── views/            # Dashboard & User Profile
└── public/               # Minimalist branding assets
