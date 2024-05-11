import { useState } from "react";

import { useAppDispatch } from "src/store/hooks";
import {
  // autoIncrement,
  // clearTimer,
  decrement,
  increment,
  incrementByAmount,
  selectCount,
} from "./autoCounterSlice";

import styles from "./AutoCounter.module.css";
import { NumberDisplay } from "src/components/NumberDisplay/NumberDisplay";

export function AutoCounter() {
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
        Bubble Machines: <NumberDisplay selector={selectCount} />
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
