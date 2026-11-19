# ShuleERP Kenya — Multi-Tenant School Management & M-Pesa Reconciliation System

A full-stack school ERP tailored for Kenyan private academies, featuring **automated Safaricom M-Pesa C2B Paybill reconciliation**, **Competency-Based Curriculum (CBC) strand grading**, and **printable official fee statements & progress reports**.

## Key Engineering Highlights
- **Atomic M-Pesa Paybill Reconciliation:** Uses `django.db.transaction.atomic()` and `select_for_update()` row locking to prevent race conditions when crediting student fee ledgers via `BillRefNumber`.
- **Webhook Idempotency:** Enforces unique `TransID` validation so duplicate Safaricom Daraja callbacks never double-credit a student's balance.
- **Kenyan CBC Rubric Engine:** Tracks Competency-Based Curriculum strands and performance rubrics (`EE`, `ME`, `AE`, `BE`) alongside printable report cards.
- **JWT Role-Based Security:** Built with Django REST Framework + SimpleJWT and a responsive React + Tailwind CSS dashboard.

## Tech Stack
- **Backend:** Python, Django, Django REST Framework, SimpleJWT
- **Frontend:** React (Vite), Tailwind CSS, Axios, Lucide Icons
- **Database:** PostgreSQL / SQLite
- **Testing:** Django TestCase (`APIClient` financial webhook & idempotency tests)

## Local Setup Instructions

### 1. Backend (Django API)
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8080
```

### 2. Frontend (React + Tailwind)
```bash
cd frontend
npm install
npm run dev
```

### 3. Run Automated Financial Tests
```bash
cd backend
python manage.py test
```
