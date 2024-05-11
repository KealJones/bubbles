import { useState } from "react";

import { useAppDispatch } from "src/store/hooks";
import {
  decrement,
  increment,
  incrementByAmount,
  selectExponentialCount,
} from "./counterSlice";

import styles from "./Counter.module.css";
import { NumberDisplay } from "src/components/NumberDisplay/NumberDisplay";

export function Counter() {
  const dispatch = useAppDispatch();
  const [incrementAmount, setIncrementAmount] = useState("2");

  const incrementValue = Number(incrementAmount) || 0;

  return (
    <div>
      <div className={styles.row}>
        <button
          className={styles.button}
          aria-label="Decrement value"
          onClick={() => dispatch(decrement())}
        >
          -
        </button>
        <NumberDisplay selector={selectExponentialCount} />
        <button
          className={styles.button}
          aria-label="Increment value"
          onClick={() => dispatch(increment())}
        >
          +
        </button>
      </div>
      <div className={styles.row}>
        <input
          className={styles.textbox}
          aria-label="Set increment amount"
          value={incrementAmount}
          onChange={(e) => setIncrementAmount(e.target.value)}
        />
        <button
          className={styles.button}
          onClick={() => dispatch(incrementByAmount(incrementValue))}
        >
          Add Amount
        </button>
      </div>
    </div>
  );
}
