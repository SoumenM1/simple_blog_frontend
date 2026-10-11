# Inkline Frontend

React-based frontend for **Inkline**, a blog application connected to the versioned Inkline REST API.

## Table of contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment setup](#environment-setup)
- [Run and build](#run-and-build)
- [Application pages](#application-pages)
- [Backend API integration](#backend-api-integration)
- [Authentication and refresh tokens](#authentication-and-refresh-tokens)
- [Roles and route protection](#roles-and-route-protection)
- [Troubleshooting](#troubleshooting)
- [Demo video plan](#demo-video-plan)

## Features

- Responsive blog home/feed and post detail pages.
- Register and sign in with email/password.
- Shared authentication state through React Context.
- Session restoration through `/auth/me`.
- Automatic refresh attempt after an eligible `401` response.
- Create, edit, publish, and delete the current user's posts.
- Read and create comments, and edit/delete comments according to permissions.
- Admin dashboard with user/post/comment counts.
- Admin user management and role changes.
- Admin post status moderation and comment moderation.
- Google and Facebook OAuth entry buttons, when the backend providers are configured.

The UI calls the backend for supported features. Any feature without a matching backend endpoint will not persist to the database.

## Technology stack

- React 19
- Vite
- React Router
- Tailwind CSS
- Axios
- Lucide React icons
- Socket.IO client dependency (only use it if a corresponding backend socket feature is configured)

## Requirements

- Node.js 20+ recommended.
- npm.
- A running Inkline backend and MongoDB database.

## Installation

From the frontend project directory:

```bash
npm install
```

Create a local environment file:

**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```

**macOS/Linux**
```bash
cp .env.example .env
```

## Environment setup

Set the backend API URL in `.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

If the project’s `.env.example` includes other variables, keep their exact names and configure them only if the related feature is used. Vite exposes variables prefixed with `VITE_` to client-side code, so never put secrets in frontend environment variables.

## Run and build

Start the development server:

```bash
npm run dev
```

Vite will print the local URL, commonly `http://localhost:5173`.

Create a production build:

```bash
npm run build
```

Run ESLint:

```bash
npm run lint
```

Preview the production build locally:

```bash
npm run preview
```

## Application pages

| Page/route | Purpose |
|---|---|
| `/` | Public published-post feed |
| `/login` | Sign in |
| `/register` | Create account |
| `/posts/:slug` | Read a post and its comments |
| `/write` | Create or edit a post |
| `/my-posts` | Manage the signed-in user's posts |
| `/admin` | Admin dashboard |
| `/admin/users` | Admin user management |
| `/admin/posts` | Admin post moderation |
| `/admin/comments` | Admin comment moderation |

The exact routes are defined in `src/App.jsx`; update this table if route names change.

## Backend API integration

The API client is in `src/services/api.js`. Its base URL comes from `VITE_API_URL` and it should use `withCredentials: true` for cookie-based refresh authentication.

The frontend uses the `/api/v1` API, including:

- `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/me`
- `/posts`, `/posts/:slug`, `/posts/my-posts`
- `/posts/:postId/comments` and `/posts/comments/:id`
- `/admin/dashboard`, `/admin/users`, `/admin/posts`, `/admin/comments`

The backend README is the canonical reference for endpoint permissions, request bodies, response shapes, and OAuth configuration. Keep the frontend response parsing aligned with the backend's `{ success: true, data: ... }` response format.

## Authentication and refresh tokens

The frontend uses React Context to hold the current user and loading/authentication state. Context does not replace server-side authentication.

- The backend sets HttpOnly cookies for refresh-token handling.
- Axios must use `withCredentials: true`.
- JavaScript should not attempt to read an HttpOnly cookie.
- The API client may attempt one refresh and retry the original request after an eligible `401`.
- Logout should call the backend and clear the frontend user state.
- The backend's CORS `CLIENT_URL` must match the frontend origin exactly.

For a cross-site production deployment, serve both sides over HTTPS and configure backend cookies/CORS appropriately.

## Roles and route protection

The frontend can hide or protect admin-only pages for usability, but the backend must remain the security authority. Admin endpoints should reject regular users even if someone manually calls them from the browser or an API client.

To test admin pages locally, promote a test user through a trusted database operation as described in the backend README. Do not add an admin role selector to public registration.

## Troubleshooting

- **Frontend cannot reach API:** check that the backend is running and `VITE_API_URL` points to the correct port and `/api/v1` prefix.
- **CORS or cookie issue:** align frontend origin with backend `CLIENT_URL`, and confirm Axios uses `withCredentials: true`.
- **Login returns success but user remains logged out:** inspect the login response shape and `/auth/me`; ensure AuthContext stores the returned user or reloads it.
- **Repeated 401 responses:** inspect refresh-token expiry, cookie configuration, token rotation, and whether the API client prevents infinite refresh retries.
- **Admin page redirects away:** confirm `/auth/me` returns the user's role and the signed-in account has `role: "admin"`.
- **Build error:** run `npm install` again and check the first error reported by `npm run build`.
