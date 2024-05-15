import wand from "src/assets/wand.svg";
import { useAppDispatch } from "src/store/store";
import { increment } from "../counter/counterSlice";

export function BubbleWand() {
  const dispatch = useAppDispatch();
  return (
    <div
      onClick={() => {
        dispatch(increment());
      }}
      style={{
        position: "absolute",
        bottom: 0,
        lineHeight: 0,
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      <img
        src={`${wand}`}
        style={{ width: "100px" }}
        className="App-logo"
        alt="logo"
      />
    </div>
  );
}
