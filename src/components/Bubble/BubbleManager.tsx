import { Bubble } from "src/components/Bubble/Bubble";
import {
  //useAppDispatch,
  useAppSelector,
} from "src/store/store";
import React, { useCallback, useEffect, useState } from "react";
import {
  // increment,
  selectBigCount,
  selectExponentialCount,
} from "src/mechanics/counter/counterSlice";
import styles from "./Bubble.module.css";
// import useMousePosition from "src/utils/hooks/useMousePosition";
import { Typography } from "@mui/joy";
import { NumberDisplay } from "../NumberDisplay/NumberDisplay";

export function BubbleManager({
  maxBubbles = Infinity,
}: {
  maxBubbles?: number;
}) {
  // const dispatch = useAppDispatch();
  // const getMousePosition = useMousePosition();
  // const [mousePosition, setMousePosition] = useState<number>();
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
          //const left = mousePosition;
          //setMousePosition(undefined);
          return <Bubble key={key} onPopped={onPopped(key)} />;
        }
      );
      setBubbles((bubbles) => [...bubbles, ...newBubbles]);
    }
    // Set the new count as the previous count for next render.
    prevCountRef.current = count;
  }, [count, maxBubbles, onPopped]);
  return (
    <div
      className={styles.bubbles}
      // onClick={() => {
      //   setMousePosition(getMousePosition().x);
      //   dispatch(increment());
      // }}
    >
      <Typography
        textColor="white"
        level="h3"
        sx={{ position: "absolute", top: 10, right: 10 }}
      >
        <NumberDisplay selector={selectExponentialCount} />
        Bubbles
      </Typography>
      <>{bubbles}</>
    </div>
  );
}

export default BubbleManager;
