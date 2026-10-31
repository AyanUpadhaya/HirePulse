import { baseApi } from "@/lib/baseApi";

export const companiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCompanies: builder.query({
      query: () => "/companies",
      transformResponse: (response) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Companies", id: _id })),
              { type: "Companies", id: "LIST" },
            ]
          : [{ type: "Companies", id: "LIST" }],
    }),
    getCompanyById: builder.query({
      query: (id) => `/companies/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "Companies", id }],
    }),
    createCompany: builder.mutation({
      query: (companyData) => ({
        url: "/companies",
        method: "POST",
        body: companyData,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [
        { type: "Companies", id: "LIST" },
        { type: "Profile" },
      ],
    }),
    updateCompany: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/companies/${id}`,
        method: "PATCH",
        body: patch,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Companies", id },
        { type: "Companies", id: "LIST" },
      ],
    }),
    deleteCompany: builder.mutation({
      query: (id) => ({
        url: `/companies/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Companies", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCompaniesQuery,
  useGetCompanyByIdQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} = companiesApi;

