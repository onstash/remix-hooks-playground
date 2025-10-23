import { dom } from "@remix-run/events";
import {
  createHookComponent,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "./remix-hooks";

export function App() {
  return (
    <>
      <h1>Remix Hooks</h1>
      <p>Warning: Please don't.</p>
      <h2>useState + useEffect</h2>
      <UseStateDemo />
      <h2>useReducer</h2>
      <UseReducerDemo />
      <h2>useRef</h2>
      <UseRefDemo />
      <h2>useMemo</h2>
      <UseMemoDemo />
      <h2>useCallback</h2>
      <UseCallbackDemo />
      <h2>useEffectEvent</h2>
      <UseEffectEventDemo />
    </>
  );
}

const UseStateDemo = createHookComponent(
  ({ label = "Count" }: { label?: string } = {}) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      console.log("UseStateDemo: Mounted");
    }, []);

    useEffect(() => {
      console.log("UseStateDemo: Count changed", count);
    }, [count]);

    return (
      <>
        <button
          on={dom.click(() => {
            setCount((count) => count + 1);
          })}
        >
          {label}: {count}
        </button>
        <p>
          "useEffect" logs to the console when the component is mounted and when
          the count changes.
        </p>
      </>
    );
  },
);

const UseReducerDemo = createHookComponent(() => {
  type Action =
    | { type: "increment" }
    | { type: "decrement" }
    | { type: "reset" }
    | { type: "set"; value: number };

  const reducer = (state: number, action: Action): number => {
    switch (action.type) {
      case "increment":
        return state + 1;
      case "decrement":
        return state - 1;
      case "reset":
        return 0;
      case "set":
        return action.value;
      default:
        return state;
    }
  };

  const [count, dispatch] = useReducer(reducer, 0);

  return (
    <div>
      Count: {count}{" "}
      <button
        on={dom.click(() => {
          dispatch({ type: "increment" });
        })}
      >
        +
      </button>{" "}
      <button
        on={dom.click(() => {
          dispatch({ type: "decrement" });
        })}
      >
        -
      </button>{" "}
      <button
        on={dom.click(() => {
          dispatch({ type: "reset" });
        })}
      >
        Reset
      </button>{" "}
      <button
        on={dom.click(() => {
          dispatch({ type: "set", value: 10 });
        })}
      >
        Set to 10
      </button>
    </div>
  );
});

const UseRefDemo = createHookComponent(() => {
  const clickCountRef = useRef(0);
  const [renderCount, setRenderCount] = useState(0);

  return (
    <div>
      <button
        on={dom.click(() => {
          clickCountRef.current++;
          console.log("Clicks (no re-render):", clickCountRef.current);
        })}
      >
        Increment (useRef, no re-render): {clickCountRef.current}
      </button>{" "}
      <button
        on={dom.click(() => {
          setRenderCount((c) => c + 1);
        })}
      >
        Increment (useState, re-render): {renderCount}
      </button>
      <p>
        The "useRef" counter does not update until the "useState" counter is
        updated.
      </p>
    </div>
  );
});

const UseMemoDemo = createHookComponent(() => {
  const [count, setCount] = useState(0);
  const [multiplier, setMultiplier] = useState(2);

  const expensiveResult = useMemo(() => {
    console.log("UseMemoDemo: Computing expensive result...");
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      for (let j = 0; j < multiplier; j++) {
        result += i;
      }
    }
    return result;
  }, [multiplier]);

  return (
    <div>
      <p>Result: {expensiveResult}</p>
      <button
        on={dom.click(() => {
          setCount((c) => c + 1);
        })}
      >
        Increment count (no recompute, unrelated to useMemo): {count}
      </button>{" "}
      <button
        on={dom.click(() => {
          setMultiplier((m) => m + 1);
        })}
      >
        Update multiplier (recompute, useMemo dependency): {multiplier}
      </button>
    </div>
  );
});

const UseCallbackDemo = createHookComponent(() => {
  const [count, setCount] = useState(0);
  const [otherState, setOtherState] = useState(0);

  const callback = useCallback(() => {
    setCount((c) => c + 1);
  }, [count]);

  useEffect(() => {
    console.log("UseCallbackDemo: Callback reference changed");
  }, [callback]);

  return (
    <div>
      <button on={dom.click(callback)}>
        Increment while creating a new callback: {count}
      </button>{" "}
      <button
        on={dom.click(() => {
          setOtherState((s) => s + 1);
        })}
      >
        Increment while keeping callback stable: {otherState}
      </button>
      <p>This example logs to the console when a new callback is created.</p>
    </div>
  );
});

const UseEffectEventDemo = createHookComponent(() => {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("Alice");
  const [logCount, setLogCount] = useState(0);
  const [loggingEnabled, setLoggingEnabled] = useState(false);

  // useEffectEvent: Access latest state without re-running the effect
  const logMessage = useEffectEvent(() => {
    if (loggingEnabled) {
      console.log(`UseEffectEventDemo: Name is "${name}", Count is ${count}`);
      setLogCount((c) => c + 1);
    }
  });

  useEffect(() => {
    if (loggingEnabled) {
      console.log("UseEffectEventDemo: Setting up interval (only once!)");
    }
    const interval = setInterval(() => {
      logMessage(); // Always logs the latest name and count
    }, 2000);

    return () => {
      if (loggingEnabled) {
        console.log("UseEffectEventDemo: Cleaning up interval");
      }
      clearInterval(interval);
    };
  }, []); // Empty deps! Effect doesn't re-run when name or count changes

  return (
    <div>
      <p>
        Name: {name}, Count: {count}, Logs: {logCount}
      </p>
      <button
        on={dom.click(() => {
          setLoggingEnabled((e) => !e);
        })}
      >
        Logging: {loggingEnabled ? "ON" : "OFF"}
      </button>{" "}
      <button
        on={dom.click(() => {
          setName((n) => (n === "Alice" ? "Bob" : "Alice"));
        })}
      >
        Toggle Name
      </button>{" "}
      <button
        on={dom.click(() => {
          setCount((c) => c + 1);
        })}
      >
        Increment Count
      </button>
      <p>Interval logs every 2s with latest values, but effect never re-runs</p>
    </div>
  );
});
