# 🎨 Real-Time Kanban Frontend

Frontend for a real-time collaborative Kanban board built with React.

Designed to deliver a smooth multi-user experience with live updates, drag-and-drop interactions, and real-time feedback.

---

## ⚙️ Features

- Real-time task and column updates (WebSocket sync)
- Drag & drop with position-based ordering
- Live cursor tracking for each user
- Board presence system (online users)
- Typing indicators for collaborative interaction
- Optimistic UI updates with rollback on failure
- Activity feed with live updates and pagination

---

## 🧱 UI & Experience

- Responsive Kanban board layout
- Smooth drag-and-drop interactions using @dnd-kit
- Real-time visual feedback (cursors, presence, typing)
- Loading states and error handling
- Toast notifications and confirmation dialogs

---

## 🛠️ Tech Stack

- React 18  
- Vite  
- Tailwind CSS  
- @dnd-kit (drag & drop)  
- Axios  
- SockJS + STOMP (WebSockets)  

---

## 🔌 API Integration

- Communicates with Spring Boot backend via REST APIs
- WebSocket connection for real-time updates
- JWT stored in sessionStorage for authentication

---

## ⚡ Real-Time

- Subscribes to board-specific topics
- Handles:
  - Task & column updates  
  - Activity feed  
  - Presence (online users)  
  - Live cursors  
  - Typing indicators  

---

## 🧪 Running Locally

```bash
git clone https://github.com/ChinthaRithwik/kanban-frontend.git
cd frontend
npm install
npm run dev
