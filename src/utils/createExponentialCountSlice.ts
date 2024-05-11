/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  PayloadAction,
  createSlice,
  CreateSliceOptions,
  SliceCaseReducers,
  SliceSelectors,
  CaseReducer,
  ValidateSliceCaseReducers,
  Slice,
  Draft,
} from "@reduxjs/toolkit";
import { convertExponentToPower } from "src/components/NumberDisplay/numberScaleName";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type ExponentialCountSliceReducers<State> = SliceCaseReducers<State> & {
  increment: CaseReducer<State>;
  decrement: CaseReducer<State>;
  incrementByAmount: CaseReducer<State, PayloadAction<number | bigint>>;
};

export interface ExponentialCountSliceState {
  count: number;
  exponent: number;
  bigCount: bigint;
}

// export const createExponentialCountSlice = <State extends { count: number }, CaseReducers extends SliceCaseReducers<State>, Name extends string, Selectors extends SliceSelectors<State>, ReducerPath extends string = Name>(options: PartialBy<CreateSliceOptions<State, CaseReducers, Name, ReducerPath, Selectors>, 'reducers'>): Slice<State, CaseReducers, Name, ReducerPath, Selectors> => {
export const createExponentialCountSlice = <
  State extends ExponentialCountSliceState,
  CaseReducers extends ExponentialCountSliceReducers<State>,
  Name extends string,
  Selectors extends SliceSelectors<State>,
  ReducerPath extends string = Name
>(
  options: PartialBy<
    CreateSliceOptions<State, CaseReducers, Name, ReducerPath, Selectors>,
    "reducers" | "initialState"
  >
): Slice<State, CaseReducers, Name, ReducerPath, Selectors> => {
  const incrementByAmount = (
    state: Draft<State>,
    action: PayloadAction<number | bigint>
  ) => {
    //console.log("incrementByAmount", state, action);
    const bigCount = BigInt(state.bigCount) + BigInt(action.payload);
    const exponentialCount = bigCount.toLocaleString("en-US", {
      notation: "engineering",
    });
    const [base, exponent] = exponentialCount.split(/e/i);
    const power = convertExponentToPower(Number(exponent));

    state.bigCount = bigCount;

    if (power < 1) {
      state.count = Number(bigCount);
      state.exponent = 0;
      return;
    }

    state.count = Number(base);
    state.exponent = power;
  };

  return createSlice<State, CaseReducers, Name, Selectors, ReducerPath>({
    ...options,
    // @ts-expect-error - its valid that State could be different but it wont be.
    initialState: {
      count: 0,
      exponent: 0,
      bigCount: 0n,
      ...(options.initialState != null &&
      typeof options.initialState === "function"
        ? options.initialState()
        : options.initialState ?? {}),
    },
    // The `reducers` field lets us define reducers and generate associated actions
    reducers: {
      increment: (state, action) => {
        incrementByAmount(state, { ...action, payload: 1 });
      },
      decrement: (state, action) => {
        incrementByAmount(state, { ...action, payload: -1 });
      },
      // Use the PayloadAction type to declare the contents of `action.payload`
      incrementByAmount: incrementByAmount,
      ...(options.reducers ?? {}),
    } as ValidateSliceCaseReducers<State, CaseReducers>,
  });
};
