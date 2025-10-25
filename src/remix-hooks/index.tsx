import type { Remix } from "@remix-run/dom";

// Global variable to track the current rendering component state
let currentComponentState: HookComponentState | null = null;

// Discriminated union for all possible hook states
type HookState =
  | {
      type: "useState";
      value: unknown;
      setState: (newValue: unknown) => void;
    }
  | {
      type: "useEffect";
      deps: unknown[] | undefined;
      cleanup?: (() => void) | void;
    }
  | {
      type: "useRef";
      value: { current: unknown };
    }
  | {
      type: "useMemo";
      value: unknown;
      deps: unknown[];
    }
  | {
      type: "useCallback";
      callback: (...args: unknown[]) => unknown;
      deps: unknown[];
    }
  | {
      type: "useReducer";
      value: unknown;
      dispatch: (action: unknown) => void;
    }
  | {
      type: "useContext";
    }
  | {
      type: "useEffectEvent";
      callback: (...args: any[]) => any;
      stableCallback: (...args: any[]) => any;
    };

interface HookComponentState {
  handle: Remix.Handle;
  currentHookIndex: number;
  hookStates: HookState[];
  isFirstRender: boolean;
}

function validateHook(hookType: HookState["type"]): void {
  if (!currentComponentState) {
    throw new Error(
      `'${hookType}' must be called within a component defined with 'createHookComponent'`,
    );
  }

  const state = currentComponentState;
  const currentIndex = state.currentHookIndex;

  // On subsequent renders, validate the hook type matches
  if (!state.isFirstRender) {
    const existingHook = state.hookStates[currentIndex];
    if (existingHook && existingHook.type !== hookType) {
      throw new Error(
        `Hook mismatch at index ${currentIndex}: expected ${existingHook.type}, but got ${hookType}. Hooks must be called in the same order on every render.`,
      );
    }
  }
}

function resolveHookState<T>(
  type: HookState["type"],
  initializer: () => T,
): { state: T & { type: HookState["type"] }; handle: Remix.Handle } {
  validateHook(type);

  const componentState = currentComponentState!;
  const currentIndex = componentState.currentHookIndex;

  // Initialize hook state on first render
  if (componentState.hookStates[currentIndex] === undefined) {
    componentState.hookStates[currentIndex] = {
      ...initializer(),
      type,
    } as HookState;
  }

  // Increment hook index for next hook call
  componentState.currentHookIndex++;

  const hookState = componentState.hookStates[currentIndex];

  return {
    state: hookState as T & { type: HookState["type"] },
    handle: componentState.handle,
  };
}

export function createHookComponent<Props = {}, T = Remix.RemixElement>(
  componentFn: (props?: Props) => T,
) {
  return function HookComponent(this: Remix.Handle) {
    // Create hook component state to hold all hook data
    const componentState: HookComponentState = {
      currentHookIndex: 0,
      hookStates: [],
      handle: this,
      isFirstRender: true,
    };

    return (props?: Props) => {
      // Reset hook index for each render
      componentState.currentHookIndex = 0;

      // Set the current hook component state so hooks can access it
      currentComponentState = componentState;

      try {
        const result = componentFn(props);

        // After render, validate hook count
        if (!componentState.isFirstRender) {
          if (
            componentState.currentHookIndex !== componentState.hookStates.length
          ) {
            throw new Error(
              `Rendered ${componentState.currentHookIndex} Hooks, but expected ${componentState.hookStates.length}. ` +
                "The same number of Hooks must be called in the same order on every render.",
            );
          }
        } else {
          componentState.isFirstRender = false;
        }

        return result;
      } finally {
        // Clean up the current hook component state reference
        currentComponentState = null;
      }
    };
  };
}

export function useState<S>(
  initialValue: S,
): [S, (newValue: S | ((prevState: S) => S)) => void] {
  const { state, handle } = resolveHookState("useState", () => {
    const setState = (newValue: S | ((prevState: S) => S)) => {
      state.value =
        typeof newValue === "function"
          ? (newValue as (prevState: S) => S)(state.value as S)
          : newValue;
      handle.update();
    };

    return {
      value: initialValue,
      setState,
    };
  });

  return [state.value, state.setState];
}

export function useEffect(
  effect: () => void | (() => void),
  deps?: any[],
): void {
  const { state } = resolveHookState(
    "useEffect",
    (): Omit<Extract<HookState, { type: "useEffect" }>, "type"> => ({
      deps: undefined,
      cleanup: undefined,
    }),
  );

  const hasChanged =
    deps === undefined || // Always run if no deps
    state.deps === undefined || // Always run on first render
    deps.some((dep, i) => dep !== state.deps![i]); // Run if any dep changed

  if (hasChanged) {
    // Run cleanup from previous effect
    if (state.cleanup && typeof state.cleanup === "function") {
      state.cleanup();
    }

    // Run the effect and store any cleanup function
    state.cleanup = effect();
    state.deps = deps;
  }
}

export function useRef<T>(initialValue: T): { current: T } {
  const { state } = resolveHookState("useRef", () => ({
    value: { current: initialValue },
  }));

  return state.value;
}

export function useMemo<T>(factory: () => T, deps: any[]): T {
  const { state } = resolveHookState("useMemo", () => ({
    value: factory(),
    deps,
  }));

  const hasChanged = deps.some((dep, i) => dep !== state.deps[i]);

  if (hasChanged) {
    state.value = factory();
    state.deps = deps;
  }

  return state.value;
}

export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[],
): T {
  const { state } = resolveHookState("useCallback", () => ({
    callback,
    deps,
  }));

  const hasChanged = deps.some((dep, i) => dep !== state.deps[i]);

  if (hasChanged) {
    state.callback = callback;
    state.deps = deps;
  }

  return state.callback;
}

export function useReducer<S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S,
): [S, (action: A) => void];
export function useReducer<S, A, I>(
  reducer: (state: S, action: A) => S,
  initialArg: I,
  init: (arg: I) => S,
): [S, (action: A) => void];
export function useReducer<S, A, I>(
  reducer: (state: S, action: A) => S,
  initialArg: S | I,
  init?: (arg: I) => S,
): [S, (action: A) => void] {
  const { state, handle } = resolveHookState("useReducer", () => {
    const initialValue = init ? init(initialArg as I) : (initialArg as S);

    const dispatch = (action: A) => {
      state.value = reducer(state.value as S, action);
      handle.update();
    };

    return {
      value: initialValue,
      dispatch,
    };
  });

  return [state.value, state.dispatch];
}

export function useContext<T>(context: any): T {
  const { handle } = resolveHookState("useContext", () => ({}));

  return handle.context.get(context) as T;
}

export function useEffectEvent<T extends (...args: any[]) => any>(
  callback: T,
): T {
  const { state } = resolveHookState("useEffectEvent", () => {
    const stableCallback = ((...args: any[]) => {
      return state.callback(...args);
    }) as T;

    return {
      callback,
      stableCallback,
    };
  });

  // Update the callback on every render to capture the latest closure
  state.callback = callback;

  return state.stableCallback;
}
