import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currency: 0,
  clickPower: 10,
  currencyPerMs: 0.001,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    // auto increment currency
    autoIncrement: (state, action) => {
      const newCurrency = parseFloat(
        (state.currency + state.currencyPerMs * action.payload).toFixed(2)
      );
      state.currency = newCurrency;
    },

    // increment currency by click
    increment: (state) => {
      const newCurrency = parseFloat(
        (state.currency + state.clickPower).toFixed(2)
      );
      state.currency = newCurrency;
    },
  },
});

// export actions
export const { increment, autoIncrement } = gameSlice.actions;

// export reducer
export default gameSlice.reducer;
