import { baseApi } from "@/lib/baseApi";

export const messagingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query({
      query: () => "/conversations",
      transformResponse: (response) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Conversations", id: _id })),
              { type: "Conversations", id: "LIST" },
            ]
          : [{ type: "Conversations", id: "LIST" }],
    }),
    createConversation: builder.mutation({
      query: (body) => ({
        url: "/conversations",
        method: "POST",
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: "Conversations", id: "LIST" }],
    }),
    getMessages: builder.query({
      query: ({ conversationId, limit = 50 }) => ({
        url: `/conversations/${conversationId}/messages`,
        params: { limit },
      }),
      transformResponse: (response) => response.data || [],
      providesTags: (result, error, { conversationId }) => [
        { type: "Messages", id: conversationId },
      ],
    }),
    sendMessage: builder.mutation({
      query: ({ conversationId, text }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: "POST",
        body: { text },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Messages", id: conversationId },
        { type: "Conversations", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useCreateConversationMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
} = messagingApi;

