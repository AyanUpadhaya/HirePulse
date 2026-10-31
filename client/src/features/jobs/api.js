import { baseApi } from "@/lib/baseApi";

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query({
      query: (params = {}) => {
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v !== undefined && v !== "" && v !== null)
        );
        return {
          url: "/jobs",
          params: cleanParams,
        };
      },
      transformResponse: (response) => response.data || { items: [], total: 0, page: 1, pages: 1 },
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ _id }) => ({ type: "Jobs", id: _id })),
              { type: "Jobs", id: "LIST" },
            ]
          : [{ type: "Jobs", id: "LIST" }],
    }),
    getMyJobs: builder.query({
      query: () => "/jobs/mine",
      transformResponse: (response) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Jobs", id: _id })),
              { type: "Jobs", id: "MINE" },
            ]
          : [{ type: "Jobs", id: "MINE" }],
    }),
    getJobById: builder.query({
      query: (id) => `/jobs/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "Job", id }],
    }),
    createJob: builder.mutation({
      query: (jobData) => ({
        url: "/jobs",
        method: "POST",
        body: jobData,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [
        { type: "Jobs", id: "LIST" },
        { type: "Jobs", id: "MINE" },
        { type: "Categories", id: "LIST" },
      ],
    }),
    updateJob: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/jobs/${id}`,
        method: "PATCH",
        body: patch,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Job", id },
        { type: "Jobs", id: "LIST" },
        { type: "Jobs", id: "MINE" },
        { type: "Categories", id: "LIST" },
      ],
    }),
    deleteJob: builder.mutation({
      query: (id) => ({
        url: `/jobs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Job", id },
        { type: "Jobs", id: "LIST" },
        { type: "Jobs", id: "MINE" },
        { type: "Categories", id: "LIST" },
      ],
    }),
    applyJob: builder.mutation({
      query: ({ jobId, ...body }) => ({
        url: `/jobs/${jobId}/apply`,
        method: "POST",
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [
        { type: "Applications", id: "MINE" },
        { type: "Jobs", id: "MINE" },
      ],
    }),
    getJobApplications: builder.query({
      query: (jobId) => `/jobs/${jobId}/applications`,
      transformResponse: (response) => response.data || [],
      providesTags: (result, error, jobId) => [
        { type: "Applications", id: `JOB_${jobId}` },
      ],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetMyJobsQuery,
  useGetJobByIdQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useApplyJobMutation,
  useGetJobApplicationsQuery,
} = jobsApi;

