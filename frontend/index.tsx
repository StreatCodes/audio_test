import React from "react";
import { useState, Fragment } from "react";
import { createRoot } from "react-dom";

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <Fragment>
      <h1>{count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </Fragment>
  );
}

const app = document.createElement("div");
document.body.appendChild(app);
const root = createRoot(app);
root.render(<Counter />);