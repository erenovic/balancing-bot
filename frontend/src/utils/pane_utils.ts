import type { BindingParams, Pane } from "tweakpane";

type BindingWithOn<T> = {
    on(event: "change", handler: (event: { value: T }) => void): void;
};

type BindingPane = Pane & {
    addBinding<O extends Record<string, unknown>, Key extends keyof O>(
        target: O,
        key: Key,
        params?: BindingParams,
    ): BindingWithOn<O[Key]>;
};

// Utility: restrict key to number-valued properties
type KeysOfType<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T];

export function addSlider<T extends Record<string, unknown>, K extends KeysOfType<T, number>>(
    pane: Pane,
    simulationState: T,
    key: K,
    params: Record<string, unknown>,
    onChange: (value: number) => void,
): void {
    const binding = (pane as BindingPane).addBinding(
        simulationState as unknown as Record<string, number>,
        key as string,
        params as unknown as BindingParams,
    );
    binding.on("change", (event: { value: number }) => onChange(event.value));
}

export function addCheckbox<T extends Record<string, unknown>, K extends KeysOfType<T, boolean>>(
    pane: Pane,
    simulationState: T,
    key: K,
    params: Record<string, unknown>,
    onChange: (value: boolean) => void,
): void {
    const binding = (pane as BindingPane).addBinding(
        simulationState as unknown as Record<string, boolean>,
        key as string,
        params as unknown as BindingParams,
    );
    binding.on("change", (event: { value: boolean }) => onChange(event.value));
}
