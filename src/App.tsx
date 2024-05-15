import "./App.css";
import { BubbleManager } from "./components/Bubble/BubbleManager";
import { DevToolsToggler } from "./mechanics/devtools/DevTools";
import { BubbleWand } from "./mechanics/bubbleWand/BubbleWand";

function App() {
  return (
    <>
      <BubbleManager maxBubbles={300} />
      <BubbleWand />
      <DevToolsToggler />
    </>
  );
}

export default App;
