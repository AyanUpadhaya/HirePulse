import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  accessToken: null,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      if (user !== undefined) state.user = user;
      if (accessToken !== undefined) state.accessToken = accessToken;
      state.isInitialized = true;
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setInitialized: (state, action) => {
      state.isInitialized = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isInitialized = true;
    },
  },
});

export const { setCredentials, setAccessToken, setUser, setInitialized, logout } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.accessToken;
export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken && state.auth.user);
export const selectIsAuthInitialized = (state) => state.auth.isInitialized;
export const selectUserRole = (state) => state.auth.user?.role;

