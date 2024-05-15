import * as React from "react";

export const useLiveMousePosition = () => {
  const [mousePosition, setMousePosition] = React.useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });
  React.useEffect(() => {
    const updateMousePosition = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, []);
  return mousePosition;
};

export const useMousePosition = () => {
  const mousePosition = React.useRef<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });
  React.useEffect(() => {
    const updateMousePosition = (event: MouseEvent) => {
      mousePosition.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, []);
  return () => mousePosition.current;
};

export default useMousePosition;
