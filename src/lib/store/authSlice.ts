import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UserRole = "admin" | "vendor";

export interface User {
  id: number;
  name: string;
  role: UserRole;
  email: string;
  avatar: string;
}

interface AuthState {
  user: User | null;
}

const saved = localStorage.getItem("smartjal_user");
const initialState: AuthState = {
  user: saved ? JSON.parse(saved) : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<User>) {
      state.user = action.payload;
      localStorage.setItem("smartjal_user", JSON.stringify(action.payload));
    },
    logout(state) {
      state.user = null;
      localStorage.removeItem("smartjal_user");
      localStorage.removeItem("smartjal_token"); 
      localStorage.removeItem("token");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;