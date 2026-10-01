interface DebounceOptions {
    leading?: boolean; // Execute immediately on first call
    trailing?: boolean; // Execute after delay
    maxWait?: number; // Maximum wait time
}

type DebouncedFunction<T extends (...args: any[]) => any> = ((...args: Parameters<T>) => void) & {
    cancel: () => void;
};

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    options: DebounceOptions = {}
): DebouncedFunction<T> {
    let timeoutId: number | undefined;
    let lastCallTime: number | undefined;
    let lastExecTime = 0;

    const { leading = false, trailing = true, maxWait } = options;

    const debounced = (...args: Parameters<T>) => {
        const currentTime = Date.now();

        // Check if we should execute immediately (leading edge)
        if (leading && !timeoutId) {
            func(...args);
            lastExecTime = currentTime;
        }

        // Clear existing timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Check if maxWait time has been exceeded
        if (maxWait && lastCallTime && currentTime - lastCallTime >= maxWait) {
            if (trailing) {
                func(...args);
            }
            lastExecTime = currentTime;
            timeoutId = undefined;
            return;
        }

        // Set new timeout
        timeoutId = setTimeout(() => {
            if (trailing) {
                func(...args);
            }
            lastExecTime = Date.now();
            timeoutId = undefined;
        }, delay);

        lastCallTime = currentTime;
    };

    debounced.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    };

    return debounced;
}

// Utility function to create a debounced version that cancels on unmount
export function useDebounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    options?: DebounceOptions
) {
    const debouncedFunc = debounce(func, delay, options);

    return {
        debounced: debouncedFunc,
        cancel: debouncedFunc.cancel,
    };
}
