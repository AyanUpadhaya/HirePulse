import { baseApi } from "@/lib/baseApi";
import { setUser } from "@/features/auth/authSlice";

export const profilesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query({
      query: () => "/profiles/me",
      transformResponse: (response) => response.data,
      providesTags: ["Profile"],
    }),
    updateApplicantProfile: builder.mutation({
      query: (profileData) => ({
        url: "/profiles/applicant",
        method: "PATCH",
        body: profileData,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ["Profile"],
    }),
    uploadResume: builder.mutation({
      query: (formData) => ({
        url: "/profiles/applicant/resume",
        method: "POST",
        body: formData,
        // Browser sets boundary automatically for multipart/form-data
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ["Profile"],
    }),
    updateRecruiterProfile: builder.mutation({
      query: (profileData) => ({
        url: "/profiles/recruiter",
        method: "PATCH",
        body: profileData,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ["Profile"],
    }),
    getApplicantProfileById: builder.query({
      query: (id) => `/profiles/applicants/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "Profile", id }],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateApplicantProfileMutation,
  useUploadResumeMutation,
  useUpdateRecruiterProfileMutation,
  useGetApplicantProfileByIdQuery,
} = profilesApi;

