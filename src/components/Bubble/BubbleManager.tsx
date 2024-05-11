import { Bubble } from "src/components/Bubble/Bubble";
import { useAppSelector } from "src/store/store";
import React, { useCallback, useEffect, useState } from "react";
import { selectBigCount } from "src/mechanics/counter/counterSlice";
import styles from "./Bubble.module.css";

export function BubbleManager({
  maxBubbles = Infinity,
}: {
  maxBubbles?: number;
}) {
  const count = useAppSelector(selectBigCount);
  const prevCountRef = React.useRef(0n);
  const [bubbles, setBubbles] = useState<React.ReactElement[]>([]);
  const onPopped = useCallback((key: string) => {
    return () =>
      setBubbles((bubbles) =>
        bubbles.filter((bubble) => {
          return bubble.key !== key;
        })
      );
  }, []);
  useEffect(() => {
    // If the count has increased, add new bubbles.
    if (count > prevCountRef.current) {
      const newBubbles = Array.from(
        { length: Math.min(Number(count - prevCountRef.current), maxBubbles) },
        (_, i) => {
          const key = `${Number(prevCountRef.current) + i++}`;
          return <Bubble key={key} onPopped={onPopped(key)} />;
        }
      );
      setBubbles((bubbles) => [...bubbles, ...newBubbles]);
    }
    // Set the new count as the previous count for next render.
    prevCountRef.current = count;
  }, [count, maxBubbles, onPopped]);
  return (
    <div className={styles.bubbles}>
      <>{bubbles}</>
    </div>
  );
}

export default BubbleManager;
