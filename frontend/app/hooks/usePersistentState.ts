import { useState } from "react";

type StorageType = "session" | "local";

function getStorage(type: StorageType): Storage {
  return type === "local" ? localStorage : sessionStorage;
}

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  storage: StorageType = "local"
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = getStorage(storage).getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  function setPersistentValue(action: React.SetStateAction<T>) {
    setValue((prev) => {
      const next = action instanceof Function ? action(prev) : action;
      try {
        getStorage(storage).setItem(key, JSON.stringify(next));
      } catch {
        // storage unavailable or quota exceeded — state still updates in memory
      }
      return next;
    });
  }

  return [value, setPersistentValue];
}
