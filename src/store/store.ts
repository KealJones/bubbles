// store.ts
import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";

import gameReducer from "./state/gameSlice";
import autoCounterReducer from "../mechanics/autoCounter/autoCounterSlice";
import counterReducer from "../mechanics/counter/counterSlice";
import createSagaMiddleware from "redux-saga";
//import { rootSaga } from "./sagas/rootSaga";
import { tickSaga } from "./sagas/gameTickSaga";
// import {
//   createReduxMiddleware,
//   defaultOptions,
// } from "@karmaniverous/serify-deserify";
//import { rootSaga } from "./sagas/rootSaga";

//const serifyMiddleware = createReduxMiddleware(defaultOptions);
const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  devTools: true,
  reducer: {
    game: gameReducer,
    autoCounter: autoCounterReducer,
    counter: counterReducer,
  },
  // Add the sagaMiddleware to the middleware
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sagaMiddleware),
});

// run the root saga
//sagaMiddleware.run(rootSaga);

// run the tick saga
sagaMiddleware.run(tickSaga);

// store typing
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// hooks typing
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
