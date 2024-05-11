import { Counter } from "./mechanics/counter/Counter";
import "./App.css";
import logo from "./assets/favicon.svg";
import { AutoCounter } from "./mechanics/autoCounter/AutoCounter";
import { BubbleManager } from "./components/Bubble/BubbleManager";

function App() {
  return (
    <>
      <BubbleManager />
      <div className="App">
        <header className="App-header" style={{ zIndex: 10 }}>
          <img
            src={`${logo}`}
            style={{ width: "50px" }}
            className="App-logo"
            alt="logo"
          />
          <Counter />
          <AutoCounter />
        </header>
      </div>
    </>
  );
}

export default App;
