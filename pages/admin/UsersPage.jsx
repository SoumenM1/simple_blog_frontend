import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Users,
  ShieldCheck,
  UserRound,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Mail,
  CalendarDays,
  Shield,
  UserCog,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {api} from "../../src/services/api";

const PAGE_SIZE = 10;

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(user) {
  const name = user?.name?.trim();

  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  return user?.email?.[0]?.toUpperCase() || "U";
}

function normalizeUser(user) {
  return {
    ...user,
    id: user._id || user.id,
    name: user.name || "Unnamed user",
    email: user.email || "",
    role: user.role || "user",
    createdAt: user.createdAt || null,
    isActive: user.isActive !== false && user.isDeleted !== true,
  };
}

function RoleBadge({ role }) {
  const isAdmin = role === "admin";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isAdmin
          ? "bg-violet-50 text-violet-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {isAdmin ? <ShieldCheck size={13} /> : <UserRound size={13} />}
      {isAdmin ? "Admin" : "User"}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function UserAvatar({ user, size = "normal" }) {
  const dimensions =
    size === "large" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";

  if (user.avatar || user.profilePicture) {
    return (
      <img
        src={user.avatar || user.profilePicture}
        alt={user.name}
        className={`${dimensions} rounded-full border border-slate-200 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700`}
    >
      {getInitials(user)}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionUser, setActionUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Expected response:
      // { users: [...], total: 100, page: 1, totalPages: 10 }
      const response = await api.get("/admin/users", {
        params: {
          page,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          role: roleFilter !== "all" ? roleFilter : undefined,
        },
      });

      const data = response.data?.data ?? response.data;
      const results = Array.isArray(data)
        ? data
        : data.users || data.results || [];

      setUsers(results.map(normalizeUser));
      setTotalUsers(Number(data.total ?? data.pagination?.total ?? data.totalUsers ?? results.length));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load users. Check your admin API endpoint."
      );
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const firstItem = totalUsers === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, totalUsers);

  const adminCount = users.filter((user) => user.role === "admin").length;
  const regularCount = users.filter((user) => user.role !== "admin").length;

  const updateRole = async (user, nextRole) => {
    if (!user?.id) return;

    setActionLoading(true);
    setNotice("");
    setError("");

    try {
      // The backend exposes PATCH /admin/users/:id/role.
      await api.patch(`/admin/users/${user.id}/role`, {
        role: nextRole,
      });

      setNotice(`${user.name}'s role was updated to ${nextRole}.`);
      setActionUser(null);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update the user's role."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async (user) => {
    if (!user?.id) return;

    const confirmed = window.confirm(
      `Move ${user.name} out of active users? Their account will be soft-deleted.`
    );

    if (!confirmed) return;

    setActionLoading(true);
    setNotice("");
    setError("");

    try {
      await api.delete(`/admin/users/${user.id}`);

      setNotice(`${user.name} was removed from active users.`);
      setActionUser(null);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete this user."
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm text-slate-500">
              Inkline / Admin / Users
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Users
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage accounts, review user information, and control access.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Alerts */}
        {notice && (
          <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={fetchUsers}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Total users
              </p>
              <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <Users size={20} />
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              {loading ? "—" : totalUsers.toLocaleString()}
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Accounts matching your filters
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Admins on this page
              </p>
              <span className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                <ShieldCheck size={20} />
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              {loading ? "—" : adminCount}
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Users with administrative access
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Regular users on this page
              </p>
              <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <UserRound size={20} />
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              {loading ? "—" : regularCount}
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Standard community accounts
            </p>
          </div>
        </section>

        {/* Users table */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="font-bold text-slate-900">All users</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search and filter registered accounts.
            </p>

            <div className="mt-5 flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                aria-label="Filter by role"
              >
                <option value="all">All roles</option>
                <option value="user">Regular users</option>
                <option value="admin">Admins</option>
              </select>


            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-4 py-4 font-semibold">Role</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Joined</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={5} className="px-6 py-5">
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                        <Users size={22} />
                      </div>
                      <h3 className="mt-4 font-semibold text-slate-900">
                        No users found
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Try another search term or change your filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {user.name}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                              <Mail size={12} />
                              {user.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <RoleBadge role={user.role} />
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge active={user.isActive} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Details
                          </button>

                          <button
                            type="button"
                            onClick={() => setActionUser(user)}
                            aria-label={`Actions for ${user.name}`}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">{firstItem}</span>
              {" "}to{" "}
              <span className="font-semibold text-slate-800">{lastItem}</span>
              {" "}of{" "}
              <span className="font-semibold text-slate-800">{totalUsers}</span>
              {" "}users
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="px-2 text-sm text-slate-500">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* User details modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedUser(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <h2
                id="user-details-title"
                className="text-lg font-bold text-slate-900"
              >
                User details
              </h2>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label="Close details"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center text-center">
              <UserAvatar user={selectedUser} size="large" />
              <h3 className="mt-3 text-lg font-bold text-slate-900">
                {selectedUser.name}
              </h3>
              <p className="mt-1 break-all text-sm text-slate-500">
                {selectedUser.email || "No email available"}
              </p>
              <div className="mt-3 flex gap-2">
                <RoleBadge role={selectedUser.role} />
                <StatusBadge active={selectedUser.isActive} />
              </div>
            </div>

            <div className="mt-6 space-y-4 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <CalendarDays size={17} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Joined</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield size={17} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Account ID</p>
                  <p className="mt-0.5 break-all text-sm font-medium text-slate-800">
                    {selectedUser.id}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setActionUser(selectedUser);
                setSelectedUser(null);
              }}
              className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Manage user
            </button>
          </section>
        </div>
      )}

      {/* User actions modal */}
      {actionUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setActionUser(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-actions-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="user-actions-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Manage user
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {actionUser.name}
                </p>
              </div>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setActionUser(null)}
                aria-label="Close actions"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                disabled={
                  actionLoading ||
                  actionUser.role === "admin" ||
                  !actionUser.id
                }
                onClick={() => updateRole(actionUser, "admin")}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShieldCheck size={19} className="text-violet-600" />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Promote to admin
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Grant administrative permissions
                  </span>
                </span>
              </button>

              <button
                type="button"
                disabled={
                  actionLoading ||
                  actionUser.role !== "admin" ||
                  !actionUser.id
                }
                onClick={() => updateRole(actionUser, "user")}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserCog size={19} className="text-slate-600" />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Remove admin role
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Change this account to a regular user
                  </span>
                </span>
              </button>

              <button
                type="button"
                disabled={actionLoading || !actionUser.id}
                onClick={() => deleteUser(actionUser)}
                className="flex w-full items-center gap-3 rounded-xl border border-red-200 p-4 text-left transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={19} className="text-red-600" />
                <span>
                  <span className="block text-sm font-semibold text-red-700">
                    Delete user
                  </span>
                  <span className="mt-1 block text-xs text-red-500">
                    Permanently remove this account
                  </span>
                </span>
              </button>
            </div>

            {actionLoading && (
              <p className="mt-4 text-center text-sm text-slate-500">
                Processing request...
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
