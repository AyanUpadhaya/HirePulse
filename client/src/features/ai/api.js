import { baseApi } from "@/lib/baseApi";

export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    generateJobDescription: builder.mutation({
      query: (promptData) => ({
        url: "/ai/job-description",
        method: "POST",
        body: promptData,
      }),
      transformResponse: (response) => response.data,
    }),
    getJobMatchInsights: builder.mutation({
      query: ({ jobId, consent = true }) => ({
        url: "/ai/job-match-insights",
        method: "POST",
        body: { jobId, consent },
      }),
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  useGenerateJobDescriptionMutation,
  useGetJobMatchInsightsMutation,
} = aiApi;

