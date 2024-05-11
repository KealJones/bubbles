import { call, delay } from "redux-saga/effects";
import { gameLoopSaga } from "./gameLoopSaga";

export function* tickSaga() {
  while (true) {
    yield delay(1000);
    yield call(gameLoopSaga);
  }
}
