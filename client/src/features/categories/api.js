import { baseApi } from "@/lib/baseApi";

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: (params) => ({
        url: "/job-categories",
        params: params?.includeInactive ? { includeInactive: true } : undefined,
      }),
      transformResponse: (response) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Categories", id: _id })),
              { type: "Categories", id: "LIST" },
            ]
          : [{ type: "Categories", id: "LIST" }],
    }),
    getCategoryById: builder.query({
      query: (id) => `/job-categories/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "Categories", id }],
    }),
    createCategory: builder.mutation({
      query: (categoryData) => ({
        url: "/job-categories",
        method: "POST",
        body: categoryData,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/job-categories/${id}`,
        method: "PATCH",
        body: patch,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: "Categories", id },
        { type: "Categories", id: "LIST" },
      ],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/job-categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;

