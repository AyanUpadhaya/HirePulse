import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, logout } from "@/features/auth/authSlice";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Mutex mechanism to prevent concurrent refresh calls
let refreshPromise = null;

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Wait if a refresh is already in progress
  if (refreshPromise) {
    await refreshPromise;
  }

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Only attempt refresh if this wasn't already a call to /auth/refresh or /auth/login
    const isAuthEndpoint =
      typeof args === "string"
        ? args.includes("/auth/refresh") || args.includes("/auth/login")
        : args.url?.includes("/auth/refresh") || args.url?.includes("/auth/login");

    if (!isAuthEndpoint) {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const refreshResult = await rawBaseQuery(
              { url: "/auth/refresh", method: "POST" },
              api,
              extraOptions
            );

            if (refreshResult.data && refreshResult.data.success && refreshResult.data.data) {
              api.dispatch(setCredentials(refreshResult.data.data));
              return true;
            } else {
              api.dispatch(logout());
              return false;
            }
          } catch {
            api.dispatch(logout());
            return false;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      const refreshed = await refreshPromise;
      if (refreshed) {
        // Retry the original query
        result = await rawBaseQuery(args, api, extraOptions);
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "Jobs",
    "Job",
    "Applications",
    "Companies",
    "Categories",
    "Profile",
    "Recommendations",
    "Conversations",
    "Messages",
    "Notifications",
    "Users",
  ],
  endpoints: () => ({}),
});

