import { Counter } from "./mechanics/counter/Counter";
import "./App.css";
import logo from "./assets/favicon.svg";
import { AutoCounter } from "./mechanics/autoCounter/AutoCounter";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={`${logo}`} className="App-logo" alt="logo" />
        <Counter />
        <AutoCounter />
      </header>
    </div>
  );
}

export default App;
