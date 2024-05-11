import { useEffect, useRef } from "react";
import { useAppSelector } from "src/store/hooks";
import { RootState } from "src/store/store";

import styles from "./NumberDisplay.module.css";
import { numberScaleName } from "./numberScaleName";

export function NumberDisplay({
  selector,
}: {
  selector: (state: RootState) => number | [number, number];
}) {
  let count = 0,
    exponent = 0;
  const selectedCount = useAppSelector(selector);
  if (typeof selectedCount == "number") {
    count = selectedCount;
  }

  if (Array.isArray(selectedCount)) {
    count = selectedCount[0];
    exponent = selectedCount[1];
  }
  // const count = typeof selectedCount === 'string' ? parseFloat(selectedCount.split('e')[0]) : selectedCount;
  // const exponent = typeof selectedCount === 'string' ? parseFloat(selectedCount.split('e')[1]) : 0;
  const prevCountRef = useRef(count);
  useEffect(() => {
    prevCountRef.current = count;
  }, [count]);
  return (
    <span
      className={styles.value}
      style={
        {
          "--num": count / 100,
          content:
            exponent < 2
              ? `counter(p1)`
              : `counter(p1) "." counter(p2, decimal-leading-zero)`,
        } as React.CSSProperties
      }
    >
      {exponent > 0 ? ` ${numberScaleName(exponent)}` : ""}
    </span>
  );
}
