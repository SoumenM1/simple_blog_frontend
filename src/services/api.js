import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshing = false;
let waiting = [];
function settle(error) {
  waiting.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  waiting = [];
}
function isAuthEndpoint(url = "") {
  return /\/auth\/(login|register|refresh|logout|google|facebook)(?:\?|$)/.test(
    url,
  );
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.data?.error?.message && !error.response.data.message) {
      error.response.data.message = error.response.data.error.message;
    }
    const request = error.config;
    if (
      error.response?.status !== 401 ||
      !request ||
      request._retried ||
      isAuthEndpoint(request.url)
    ) {
      return Promise.reject(error);
    }
    if (refreshing) {
      return new Promise((resolve, reject) =>
        waiting.push({ resolve, reject }),
      ).then(() => api(request));
    }
    request._retried = true;
    refreshing = true;
    try {
      await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      settle();
      return api(request);
    } catch (refreshError) {
      settle(refreshError);
      window.dispatchEvent(new CustomEvent("inkline:session-expired"));
      return Promise.reject(refreshError);
    } finally {
      refreshing = false;
    }
  },
);
