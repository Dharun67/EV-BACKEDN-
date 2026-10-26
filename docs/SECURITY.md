# GridWise Security Architecture

This document outlines the security architecture implemented in Step 34.

## Overview
The GridWise platform relies on a secure Node.js Backend, a React Frontend, and an ML Service in Python. The system follows standard security practices such as zero-trust for external API inputs, defense-in-depth, and principle of least privilege.

## Authentication
- **Mechanism:** JWT (JSON Web Tokens)
- **Hashing:** bcrypt (12 rounds)
- **Token Expiry:** Configurable via `JWT_EXPIRES_IN`
- **Validation:** Missing or malformed tokens result in an immediate `401 Unauthorized`. Expired tokens also trigger a `401`.

## Authorization
Role-Based Access Control (RBAC) is implemented via the `authorize` middleware.
Roles available: `Admin`, `CPO Manager`, `Fleet Manager`, `Planner`, `Driver`, `Support`

| Area | Permitted Roles | Description |
| ---- | --------------- | ----------- |
| `/incidents` (write) | Admin, Support, Fleet Manager, CPO Manager | Incident creation and simulation |
| `/decisions` (approve) | Admin | Approving AI Automation actions |
| `/maintenance` | Admin, Support, Fleet Manager | Viewing maintenance statistics and overrides |

Users are also prevented from accessing resources that don't belong to them (e.g. attempting to cancel another driver's booking will yield `403 Forbidden`).

## Network Security & Rate Limiting
- **Helmet:** Implements strict security headers (HSTS, Content Security Policy, XSS filtering).
- **CORS:** Configured to allow only specific trusted origins (`FRONTEND_URL` environment variable).
- **Rate Limiting:**
  - Global: 100 requests / 15 minutes per IP
  - Auth: 10 login/register requests / 15 minutes per IP
  - Critical Actions (e.g., rebooking, approving automation): 20 requests / 15 minutes per IP

## Data Validation & Error Handling
- **Zod:** Used for strong runtime validation of incoming request bodies (e.g., login, register).
- **Error Handling:** 
  - Centralized Express Error Handler.
  - In `production`, internal server errors (`500`) are masked so that stack traces are not leaked to clients.

## Secrets Management
- No secrets (e.g., `JWT_SECRET`, `MONGO_URI`) are checked into source control.
- Example `.env.example` templates are provided.
