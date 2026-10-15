import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  Meter, Transaction, Settlement, SettlementRequest, AppUser,
  initialMeters, initialTransactions, initialSettlements, initialUsers,
} from "../data";

interface AppState {
  meters: Meter[];
  transactions: Transaction[];
  settlements: Settlement[];
  settlementRequests: SettlementRequest[];
  settleConfig: { daily: number; immediate: number };
  users: AppUser[];
}

const initialState: AppState = {
  meters: initialMeters,
  transactions: initialTransactions,
  settlements: initialSettlements,
  settlementRequests: [],
  settleConfig: { daily: 2, immediate: 5 },
  users: initialUsers,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setMeters(state, action: PayloadAction<Meter[]>) {
      state.meters = action.payload;
    },
    setTransactions(state, action: PayloadAction<Transaction[]>) {
      state.transactions = action.payload;
    },
    setSettlements(state, action: PayloadAction<Settlement[]>) {
      state.settlements = action.payload;
    },
    setSettlementRequests(state, action: PayloadAction<SettlementRequest[]>) {
      state.settlementRequests = action.payload;
    },
    setSettleConfig(state, action: PayloadAction<{ daily: number; immediate: number }>) {
      state.settleConfig = action.payload;
    },
    setUsers(state, action: PayloadAction<AppUser[]>) {
      state.users = action.payload;
    },
  },
});

export const {
  setMeters, setTransactions, setSettlements,
  setSettlementRequests, setSettleConfig, setUsers,
} = appSlice.actions;

export default appSlice.reducer;
