import { baseApi } from "@/lib/baseApi";

export const recommendationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    generateJobRecommendations: builder.mutation({
      query: () => ({
        url: "/recommendations/jobs/generate",
        method: "POST",
      }),
      transformResponse: (response) => response.data || [],
      invalidatesTags: ["Recommendations"],
    }),
    generateCandidateRecommendations: builder.mutation({
      query: () => ({
        url: "/recommendations/candidates/generate",
        method: "POST",
      }),
      transformResponse: (response) => response.data || [],
      invalidatesTags: ["Recommendations"],
    }),
    updateRecommendation: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/recommendations/${id}`,
        method: "PATCH",
        body: patch,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ["Recommendations"],
    }),
  }),
});

export const {
  useGenerateJobRecommendationsMutation,
  useGenerateCandidateRecommendationsMutation,
  useUpdateRecommendationMutation,
} = recommendationsApi;

