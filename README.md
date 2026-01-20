# 📧 Email Scheduler Service & Dashboard

A **production-grade email scheduling system** inspired by ReachInbox’s internal architecture.  
This project enables users to **schedule, queue, and send emails at scale** with strong guarantees around **persistence, rate limiting, concurrency, and fault tolerance**, along with a clean **dashboard UI**.

---

## 🚀 Features

### Backend
- Schedule emails to be sent at a **specific future time**
- **Persistent job scheduling** using **BullMQ + Redis** (no cron jobs)
- **Reliable delivery** via fake SMTP using **Ethereal Email**
- **Survives server restarts** without losing or duplicating jobs
- **Concurrency-safe** email sending
- **Hourly rate limiting** (Redis-backed, configurable)
- **Minimum delay between email sends** (provider throttling simulation)
- **Idempotent job execution** (no duplicate sends)

### Frontend
- **Google OAuth login**
- Dashboard to:
  - Schedule new emails
  - View scheduled emails
  - View sent emails
- CSV upload & parsing for bulk email scheduling
- Clean UI matching provided **Figma design**
- Loading states, empty states, and error handling

---

## 🔍 Detailed Project Scope

This project demonstrates how a **real-world email scheduling system** can be designed with **scalability, fault tolerance, and correctness** as first-class concerns.

Unlike simple schedulers, this system is built to:
- Handle **high volumes of scheduled emails**
- Respect **provider throttling limits**
- Remain **consistent across restarts**
- Scale horizontally with **multiple workers**

The goal is not just sending emails, but **sending them reliably at the right time, at scale**.

---

## 🧱 Tech Stack

### Backend
- **TypeScript**
- **Express.js**
- **BullMQ**
- **Redis**
- **PostgreSQL / MySQL**
- **Ethereal Email (SMTP)**

### Frontend
- **React.js / Next.js**
- **TypeScript**
- **Tailwind CSS**

### Infrastructure
- **Docker** (Redis & Database)

---

## 🏗️ Architecture Overview

```text
Client (React/Next)
        |
        v
Backend API (Express)
        |
        v
Relational DB (Source of Truth)
        |
        v
BullMQ Queue (Delayed Jobs)
        |
        v
Redis (Persistence + Rate Limiting)
        |
        v
Worker(s) → SMTP (Ethereal)

```



