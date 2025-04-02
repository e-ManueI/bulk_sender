# Contact Uploader Project

This project allows users to upload contact data (name, email, message) via an Excel or CSV file using a React/Next.js frontend and a Django + RabbitMQ backend.

Uploaded data is validated and sent to a RabbitMQ queue to be processed asynchronously by a background worker.

---

## Project Structure

project-root/
├── email-sender-frontend/   # Next.js frontend
├── email-sender-backend/    # Django backend with RabbitMQ integration
├── docker-compose.yml       # For backend, worker, and RabbitMQ
└── README.md

---

##  Getting Started

### 1. Clone the Repository
### 2. Start Backend Services (Docker Compose)

Make sure Docker is installed and running.

docker-compose up --build

This will spin up:

    backend – Django app running on http://localhost:8000

    rabbitmq – Message queue + management UI at http://localhost:15672

    worker – Background worker to consume and process messages

    RabbitMQ Default Credentials:

        Username: guest

        Password: guest

### 3. Set Up and Run the Frontend

In a separate terminal:

cd email-sender-frontend
npm install
npm run dev

Frontend will run at: http://localhost:3000
➕ Create a .env.local file in email-sender-frontend/:

NEXT_PUBLIC_API_URL=http://localhost:8000

### 4. Upload Flow

    Click "Download Template" to get an Excel or CSV template.

    Fill out your contact data (name, email, message).

    Upload the file.

    Data is validated and sent to RabbitMQ for background processing.

### 5. API Endpoint

    POST /api/upload/

    Content-Type: multipart/form-data

    Field: file

Example using curl:

curl -X POST -F 'file=@contact_template.xlsx' http://localhost:8000/api/upload/

## Requirements

    Docker & Docker Compose

    Node.js (v16+)

    Python 3.9+ (if running backend manually)

## Docker Services Explained
backend

    Django app

    Serves API

    Validates file and pushes data to RabbitMQ

worker

    Django management command (run_worker)

    Consumes messages from RabbitMQ

rabbitmq

    Messaging service

    Dashboard at http://localhost:15672