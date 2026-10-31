import { baseApi } from "@/lib/baseApi";
import { setCredentials, logout, setUser } from "./authSlice";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response) => response.data,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          // ignore
        }
      },
      invalidatesTags: ["Auth", "Profile"],
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      transformResponse: (response) => response.data,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          // ignore
        }
      },
      invalidatesTags: ["Auth", "Profile"],
    }),
    refresh: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
      transformResponse: (response) => response.data,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          dispatch(logout());
        }
      },
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(logout());
          dispatch(baseApi.util.resetApiState());
        }
      },
      invalidatesTags: ["Auth"],
    }),
    getMe: builder.query({
      query: () => "/auth/me",
      transformResponse: (response) => response.data?.user || response.data,
      providesTags: ["Auth"],
    }),
    updateAccount: builder.mutation({
      query: (account) => ({
        url: "/auth/account",
        method: "PATCH",
        body: account,
      }),
      transformResponse: (response) => response.data.user,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch {
          // The caller displays the mutation error.
        }
      },
      invalidatesTags: ["Auth"],
    }),
    changePassword: builder.mutation({
      query: (passwords) => ({
        url: "/auth/password",
        method: "PATCH",
        body: passwords,
      }),
    }),
    requestPasswordReset: builder.mutation({
      query: (email) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: { email },
      }),
      transformResponse: (response) => response.data,
    }),
    resetPassword: builder.mutation({
      query: ({ token, password }) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: { token, password },
      }),
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateAccountMutation,
  useChangePasswordMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
} = authApi;
