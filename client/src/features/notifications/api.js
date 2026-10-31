import { baseApi } from "@/lib/baseApi";

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params = {}) => {
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v !== undefined && v !== "" && v !== null)
        );
        return {
          url: "/notifications",
          params: cleanParams,
        };
      },
      transformResponse: (response) => response.data || { items: [], total: 0, unread: 0, page: 1, pages: 1 },
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ _id }) => ({ type: "Notifications", id: _id })),
              { type: "Notifications", id: "LIST" },
            ]
          : [{ type: "Notifications", id: "LIST" }],
    }),
    markNotificationRead: builder.mutation({
      query: ({ id, isRead = true }) => ({
        url: `/notifications/${id}`,
        method: "PATCH",
        body: { isRead },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: "Notifications", id: "LIST" }],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: "Notifications", id: "LIST" }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;

