import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/store/store";
import { createExponentialCountSlice } from "src/utils/createExponentialCountSlice";

export const counterSlice = createExponentialCountSlice({
  name: "counter",
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;

export const selectCount = (state: RootState) => state.counter.count;

export const selectBigCount = (state: RootState) => state.counter.bigCount;

export const selectExponent = (state: RootState) => state.counter.exponent;

export const selectCounter = (state: RootState) => state.counter;

// The function below is called a selector and allows us to select a count from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.count)`
export const selectExponentialCount = createSelector(
  [selectCount, selectExponent],
  (count, exponent) => [count, exponent] as [number, number]
);

export default counterSlice.reducer;
