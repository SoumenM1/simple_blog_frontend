import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth} from "../context/AuthContext";

import HomePage from "../pages/HomePage";
import AuthPage from "../pages/AuthPage";
// Import these when you create the pages:
import PostDetailPage from "../pages/PostDetailPage";
import WritePostPage from "../pages/WritePostPage";
import MyPostsPage from "../pages/MyPostsPage";
import DashboardPage from "../pages/admin/DashboardPage";
import UsersPage from "../pages/admin/UsersPage";
import PostsPage from "../pages/admin/PostsPage";
import CommentsPage from "../pages/admin/CommentsPage";

function ProtectedRoute({ children, admin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait until authentication status is restored.
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">Loading...</div>
    );
  }

  // Redirect unauthenticated users to login.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Only admins can access admin pages.
  if (admin && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      {/* Add protected routes here when their pages are ready. */}
      <Route path="/posts/:slug" element={<PostDetailPage />} />{" "}
      <Route
        path="/write"
        element={
          <ProtectedRoute>
            {" "}
            <WritePostPage />{" "}
          </ProtectedRoute>
        }
      />{" "}
      <Route
        path="/my-posts"
        element={
          <ProtectedRoute>
            {" "}
            <MyPostsPage />{" "}
          </ProtectedRoute>
        }
      />{" "}
      <Route
        path="/admin"
        element={
          <ProtectedRoute admin>
            {" "}
            <DashboardPage />{" "}
          </ProtectedRoute>
        }
      />{" "}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute admin>
            {" "}
            <UsersPage />{" "}
          </ProtectedRoute>
        }
      />{" "}
      <Route
        path="/admin/comments"
        element={
          <ProtectedRoute admin>
            <CommentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/posts"
        element={
          <ProtectedRoute admin>
            {" "}
            <PostsPage />{" "}
          </ProtectedRoute>
        }
      />{" "}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
