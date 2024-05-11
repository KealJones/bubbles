// convert object to string and store in localStorage
export function saveToLocalStorage(state: Record<string, unknown>) {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("persistentState", serializedState);
  } catch (e) {
    console.warn(e);
  }
}

// load string from localStorage and convert into an Object
// invalid output must be undefined
export function loadFromLocalStorage() {
  try {
    const serializedState = localStorage.getItem("persistentState");
    if (serializedState === null) return undefined;
    return JSON.parse(serializedState);
  } catch (e) {
    console.warn(e);
    return undefined;
  }
}
