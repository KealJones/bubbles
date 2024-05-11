import { RootState } from "src/store/store";
import {
  ExponentialCountSliceState,
  createExponentialCountSlice,
} from "src/utils/createExponentialCountSlice";

export interface FuelState extends ExponentialCountSliceState {
  capacity: number;
}

export const fuelSlice = createExponentialCountSlice({
  name: "fuel",
});

export const { increment, decrement, incrementByAmount } = fuelSlice.actions;

// The function below is called a selector and allows us to select a count from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.count)`
export const selectExponentialCount = (state: RootState) =>
  [state.counter.count, state.counter.exponent] as [number, number];

export const selectCount = (state: RootState) => state.counter.count;

export default fuelSlice.reducer;
