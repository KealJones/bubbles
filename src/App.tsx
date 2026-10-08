import "./App.css";
import { BubbleManager } from "./components/Bubble/BubbleManager";
import { DevToolsToggler } from "./mechanics/devtools/DevTools";

function App() {
  return (
    <>
      <BubbleManager maxBubbles={300} />
      <DevToolsToggler />
    </>
  );
}

export default App;
