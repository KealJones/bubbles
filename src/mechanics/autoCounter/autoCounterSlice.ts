import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/store/store";
import { createExponentialCountSlice } from "src/utils/createExponentialCountSlice";

export const autoCounterSlice = createExponentialCountSlice({
  name: "autoCounter",
});

export const { increment, decrement, incrementByAmount, setToAmount } =
  autoCounterSlice.actions;

// The function below is called a selector and allows us to select a count from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.count)`
// The function below is called a selector and allows us to select a count from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.count)`

export const selectCount = (state: RootState) => state.autoCounter.count;

export const selectBigCount = (state: RootState) => state.autoCounter.bigCount;

export const selectExponent = (state: RootState) => state.autoCounter.exponent;

// The function below is called a selector and allows us to select a count from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.count)`
export const selectExponentialCount = createSelector(
  [selectCount, selectExponent],
  (count, exponent) => [count, exponent] as [number, number]
);

export default autoCounterSlice.reducer;
