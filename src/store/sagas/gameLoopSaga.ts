import { put, select } from "redux-saga/effects";
import { incrementByAmount } from "src/mechanics/counter/counterSlice";
import { selectBigCount } from "src/mechanics/autoCounter/autoCounterSlice";

export function* gameLoopSaga() {
  // game loop logic
  const autoCounterAmount: bigint = yield select(selectBigCount);
  if (autoCounterAmount > 0) {
    yield put(incrementByAmount(autoCounterAmount));
  }
}
