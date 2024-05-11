/* eslint-disable @typescript-eslint/no-explicit-any */
import { PayloadAction, createSlice, CreateSliceOptions, SliceCaseReducers, SliceSelectors, CaseReducer, ValidateSliceCaseReducers, Slice } from "@reduxjs/toolkit"

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

type CountSliceReducers<State> = {
  increment: CaseReducer<State>,
  decrement: CaseReducer<State>,
  incrementByAmount: CaseReducer<State, PayloadAction<number>>,
};

export interface CountSliceState {
  count: number,
}

export const initialCountState: CountSliceState = {
  count: 0,
};

// export const createCountSlice = <State extends { count: number }, CaseReducers extends SliceCaseReducers<State>, Name extends string, Selectors extends SliceSelectors<State>, ReducerPath extends string = Name>(options: PartialBy<CreateSliceOptions<State, CaseReducers, Name, ReducerPath, Selectors>, 'reducers'>): Slice<State, CaseReducers, Name, ReducerPath, Selectors> => {
export const createCountSlice = <
State extends CountSliceState,
CaseReducers extends SliceCaseReducers<State>,
Name extends string,
Selectors extends SliceSelectors<State>,
ReducerPath extends string = Name,
>(
options: PartialBy<CreateSliceOptions<
  State,
  CaseReducers,
  Name,
  ReducerPath,
  Selectors
>, 'reducers'>,
): Slice<State, CaseReducers & CountSliceReducers<State>, Name, ReducerPath, Selectors> => {
  return createSlice<State, CaseReducers, Name, Selectors, ReducerPath>({
    ...options,
    // The `reducers` field lets us define reducers and generate associated actions
    reducers: {
      increment: (state) => {
        state.count += 1;
      },
      decrement: (state) => {
        state.count -= 1;
      },
      // Use the PayloadAction type to declare the contents of `action.payload`
      incrementByAmount: (state, action: PayloadAction<number>) => {
        state.count += action.payload;
      },
      ...(options.reducers ?? {}),
    } as ValidateSliceCaseReducers<State, CaseReducers>
  });
};
