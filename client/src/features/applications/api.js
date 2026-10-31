import { baseApi } from "@/lib/baseApi";

export const applicationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyApplications: builder.query({
      query: () => "/applications/mine",
      transformResponse: (response) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Applications", id: _id })),
              { type: "Applications", id: "MINE" },
            ]
          : [{ type: "Applications", id: "MINE" }],
    }),
    updateApplicationStatus: builder.mutation({
      query: ({ id, status, note }) => ({
        url: `/applications/${id}/status`,
        method: "PATCH",
        body: { status, note },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Applications", id },
        { type: "Applications", id: "MINE" },
        { type: "Jobs", id: "MINE" },
      ],
    }),
    withdrawApplication: builder.mutation({
      query: (id) => ({
        url: `/applications/${id}/withdraw`,
        method: "POST",
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: "Applications", id },
        { type: "Applications", id: "MINE" },
      ],
    }),
  }),
});

export const {
  useGetMyApplicationsQuery,
  useUpdateApplicationStatusMutation,
  useWithdrawApplicationMutation,
} = applicationsApi;

