import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const useTransition = (toggle: boolean) => {
  const didMountRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const componentRef: any = useRef(null);
  const [safeShowHide, setSafeShowHide] = useState(false);

  useLayoutEffect(() => {
    if (didMountRef.current) {
      setSafeShowHide(true);
    } else {
      didMountRef.current = true;
    }
  }, [toggle]);

  useEffect(() => {
    componentRef.current.addEventListener("transitionend", () => {
      setSafeShowHide(toggle);
    });
  }, [componentRef, setSafeShowHide, toggle]);

  return [componentRef, safeShowHide];
};
