# Remix Hooks Playground

Just playing around with making this work for Remix 3 components:

```tsx
import { dom } from "@remix-run/events";
import { createHookComponent, useState, useEffect } from "./remix-hooks";

const Counter = createHookComponent(() => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("Count changed", count);
  }, [count]);

  return (
    <button
      on={dom.click(() => {
        setCount((c) => c + 1);
      })}
    >
      Count: {count}
    </button>
  );
});
```

## PLEASE READ BEFORE DUNKING ON ME

- This is kind of a joke, but it's also a nice learning experience. I just wanted to have fun and play around with the Remix 3 component model.
- I was initially inspired by examples of how to use libraries like Jotai or TanStack Query with Remix 3. It made me think it'd be funny to take it to the logical extreme of supporting Hooks.
- This was vibe-coded and vibe-refactored in a very short amount of time. It may have bugs, inefficiencies, or be incorrect in some way. I only really thought about the happy path, and I didn't do any deep testing or validation against React's implementation. I threw together a demo app and that's it. Again, the goal was just to have fun.
- I'm wanting to show that Remix components can generally be wrapped in your own abstractions if you really want to. I'm not saying this is good or bad, just showing that it's possible.
- I'm wanting to inspire others to have fun with Remix 3 components too.
- I'm not meaning to imply that just because you have Hooks in Remix, it's now the same as React. This doesn't change anything about the core architectural differences between the two.
- I like React.

## Now that you've been warned

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

Code for the demo app is in [`src/app.tsx`](./src/app.tsx).

Code for the fake Remix Hooks library is in [`src/remix-hooks/index.tsx`](./src/remix-hooks/index.tsx).

Hooks implemented in this playground, in alphabetical order:

- useCallback
- useContext
- useEffect
- useEffectEvent
- useMemo
- useReducer
- useRef
- useState
