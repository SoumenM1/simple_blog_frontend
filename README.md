# Inkline Frontend

React 19 + Vite + React Router + Tailwind CSS frontend for the Inkline REST API.

## Run locally

1. Install Node.js 20+ and start the Inkline backend/MongoDB.
2. Copy `.env.example` to `.env`.
3. Set `VITE_API_URL=http://localhost:5000/api/v1`.
4. Run `npm install`, then `npm run dev`.

## API features connected

- Login/register/logout and `/auth/me` session restore via AuthContext.
- Automatic refresh-token cookie refresh after a protected API request returns 401.
- Published story list/detail, create/edit/delete/publish own stories.
- Comment list/create/edit/delete on article detail pages.
- Admin dashboard totals, user role/account management, post moderation, and comment moderation.
- Google/Facebook OAuth buttons redirect to backend OAuth routes when credentials are configured server-side.

The backend uses HttpOnly cookies. Keep `withCredentials: true` enabled and configure backend CORS `CLIENT_URL` to the exact frontend origin. Never commit `.env`.


## Post permissions and editing

- Regular users can edit and delete only their own posts from **My Posts**.
- Admins can open **Admin → Posts** and edit or delete any post, and change publication status.
- The edit screen uses `PUT /posts/:id` for a regular user's own post. Admin editing uses `GET /admin/posts/:id` (with a collection fallback to `GET /admin/posts`) and `PUT /admin/posts/:id`.
- These permissions must also be enforced by the backend. The frontend hides/limits entry points, but the API must verify ownership for `PUT` and `DELETE /posts/:id`, and admin role for `/admin/*` routes. If the backend uses different admin edit/detail routes, update `pages/WritePostPage.jsx` to match them.
