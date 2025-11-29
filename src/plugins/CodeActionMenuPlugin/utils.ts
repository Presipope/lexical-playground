/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {useCallback, useEffect, useMemo, useRef} from 'react';

type DebouncedFunction<T extends (...args: never[]) => void> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
  options?: {maxWait?: number},
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let maxWaitTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime: number | null = null;

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (maxWaitTimeoutId !== null) {
      clearTimeout(maxWaitTimeoutId);
      maxWaitTimeoutId = null;
    }
    lastCallTime = null;
  };

  const debouncedFn = ((...args: Parameters<T>) => {
    const now = Date.now();

    const invokeFunc = () => {
      cancel();
      fn(...args);
    };

    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set up maxWait timeout if configured and not already set
    if (options?.maxWait !== undefined && maxWaitTimeoutId === null) {
      lastCallTime = now;
      maxWaitTimeoutId = setTimeout(invokeFunc, options.maxWait);
    }

    // Set up regular debounce timeout
    timeoutId = setTimeout(invokeFunc, ms);
  }) as DebouncedFunction<T>;

  debouncedFn.cancel = cancel;

  return debouncedFn;
}

export function useDebounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
  maxWait?: number,
) {
  const funcRef = useRef<T | null>(null);
  funcRef.current = fn;

  const debouncedFn = useMemo(
    () =>
      debounce(
        (...args: Parameters<T>) => {
          if (funcRef.current) {
            funcRef.current(...args);
          }
        },
        ms,
        maxWait !== undefined ? {maxWait} : undefined,
      ),
    [ms, maxWait],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedFn.cancel();
    };
  }, [debouncedFn]);

  return debouncedFn;
}
