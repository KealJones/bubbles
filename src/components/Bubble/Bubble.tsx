import { randomIntFromInterval } from "src/utils/randomNumber";
import styles from "./Bubble.module.css";
import React, { useEffect } from "react";

export function Bubble({
  scale,
  onPopped,
}: {
  scale?: number;
  pop?: () => Promise<void>;
  onPopped?: () => void;
}) {
  const bubbleRef = React.useRef<HTMLDivElement>(null);
  const [popped, setPopped] = React.useState<boolean>(false);
  const randomLeft = React.useRef(randomIntFromInterval(-10, 100));
  const randomTop = React.useRef(randomIntFromInterval(0, 100));
  const randomFloatTime = React.useRef(randomIntFromInterval(10, 30));
  const randomScale = React.useRef(randomIntFromInterval(1, 100));
  const randomTimeout = React.useRef(randomIntFromInterval(8000, 10000));
  const randomPopLeft = React.useRef(randomIntFromInterval(20, 150));
  const randomPopTop = React.useRef(randomIntFromInterval(20, 150));
  const randomSway = React.useRef(randomIntFromInterval(2, 4));
  const offsetRef = React.useRef({
    left: `${randomPopLeft.current}px`,
    top: `${randomPopTop.current}px`,
  });
  useEffect(() => {
    if (popped) {
      setTimeout(() => onPopped?.(), 1000);
    }
  }, [onPopped, popped]);
  useEffect(() => {
    setTimeout(() => setPopped(true), randomTimeout.current);
  }, []);
  return (
    <div
      ref={bubbleRef}
      onClick={(event) => {
        const bubbleRect = bubbleRef.current?.getBoundingClientRect();
        offsetRef.current = {
          left: `calc(${
            event.clientX - (bubbleRect?.x ?? 0)
          }px / var(--scale))`,
          top: `calc(${event.clientY - (bubbleRect?.y ?? 0)}px / var(--scale))`,
        };
        setPopped(true);
      }}
      className={`${styles.bubble}`}
      style={
        {
          "--scale": scale ?? `0.${randomScale.current}`,
          cursor: "pointer",
          left: randomLeft.current + "%",
          top: randomTop.current + "%",
          "--size": popped ? "200px" : "0px",
          "--pos": `top ${offsetRef.current.top} left ${offsetRef.current.left}`,
          transform: `translateX(10vh) translateY(10vh) scale(var(--scale))`,
          animation: `animateBubble ${randomFloatTime.current}s linear infinite,
            sideWays ${randomSway.current}s ease-in-out infinite alternate`,
          ...(popped
            ? {
                maskImage: `radial-gradient(
            circle var(--size) at var(--pos),
            transparent var(--size),
            #000 0
          )`,
              }
            : {}),
        } as React.CSSProperties
      }
    ></div>
  );
}
