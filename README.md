# 🎟️ Eventonica

Eventonica is a full-stack event management platform designed to simplify the entire event lifecycle, from planning and promotion to ticketing, real-time updates, and post-event analytics. It supports multiple user roles (organizers, attendees, vendors, and admins) and offers powerful tools for event creation, live announcements, QR-code check-ins, and data-driven reporting.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4.x-blue)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/Auth-JWT-yellow)](https://jwt.io/)
[![Nodemailer](https://img.shields.io/badge/Email-Nodemailer-orange)](https://nodemailer.com/)
[![OOP](https://img.shields.io/badge/Pattern-OOP-black)](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object-oriented_JS)

## 🛠 Tech Stack

**Backend**  

- Node.js  
- Express.js  
- PostgreSQL (via `pg` client)  
- JWT for authentication  
- Nodemailer + Ethereal for email notifications  

**Architecture & Design**  

- RESTful API  
- Object-Oriented Controllers  
- Modular route structure  
- Layered data model (users, events, tickets, orders, notifications)

**Testing & Tools**  

- Postman for endpoint testing  
- Console & database verification  
- Ethereal email previews for notification validation  

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/eventonica.git
cd eventonica/apps/server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file

```env
DATABASE_URL=postgresql://<user>@localhost:5432/eventonica
JWT_SECRET=your_jwt_secret
PORT=4000
```

### 4. Migrate and seed the database

```bash
npm run db:migrate
npm run db:seed
```

### 5. Run the server

```bash
npm run dev
```

Server runs at:  
👉 http://localhost:4000  
Frontend (when built) will connect to it on port `5173`.

---

## 🧪 API Overview

| Method     | Endpoint                            | Description                         | Auth            |
| ---------- | ----------------------------------- | ----------------------------------- | --------------- |
| **POST**   | `/api/auth/register`                | Register new user                   | Public          |
| **POST**   | `/api/auth/login`                   | Login user, return JWT              | Public          |
| **GET**    | `/api/events`                       | List all published events           | Public          |
| **POST**   | `/api/events`                       | Create event                        | Organizer/Admin |
| **PATCH**  | `/api/events/:id`                   | Update event                        | Organizer/Admin |
| **DELETE** | `/api/events/:id`                   | Delete event                        | Organizer/Admin |
| **POST**   | `/api/events/:eventId/ticket-types` | Create ticket type                  | Organizer       |
| **PATCH**  | `/api/ticket-types/:id`             | Update ticket type                  | Organizer       |
| **POST**   | `/api/events/:id/checkout`          | Register attendee / purchase ticket | Attendee        |
| **POST**   | `/api/checkin`                      | Check in ticket by token            | Organizer       |
| **GET**    | `/api/events/:id/analytics`         | Analytics summary                   | Organizer/Admin |
| **POST**   | `/api/events/:id/announcements`     | Post event update                   | Organizer/Admin |
| **GET**    | `/api/events/:id/announcements`     | List event updates                  | Public          |
| **GET**    | `/api/me/notifications`             | Fetch user notifications            | Authenticated   |
| **POST**   | `/api/events/:id/vendors`           | Assign vendor                       | Organizer/Admin |
| **GET**    | `/api/events/:id/vendors`           | List event vendors                  | Public          |

---

## 🧩 Database Schema (Simplified)

- **users** — id, name, email, password_hash, roles  
- **events** — id, title, description, organizer_id, start_time, end_time  
- **ticket_types** — id, name, price_cents, quantity, event_id  
- **orders** — id, user_id, event_id, total_amount  
- **tickets** — id, order_id, user_id, event_id, ticket_type_id, qr_code  
- **event_assignments** — event_id, user_id, role (`vendor`)  
- **notifications** — id, user_id, event_id, type, payload, read_at  
- **event_updates** — id, event_id, message, created_by  

## 🙌 Acknowledgements

- [Nodemailer + Ethereal](https://ethereal.email/) for test email alerts  