import { Pane } from "tweakpane";

// Utility: restrict key to number-valued properties
type KeysOfType<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T];

export function addSlider<T extends Record<string, unknown>, K extends KeysOfType<T, number>>(
    pane: Pane,
    simulationState: T,
    key: K,
    params: Record<string, unknown>,
    onChange: (value: number) => void,
): void {
    const binding = pane.addBinding(
        simulationState as unknown as Record<string, number>,
        key as string,
        params,
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
    const binding = pane.addBinding(simulationState as unknown as Record<string, boolean>, key as string, params);
    binding.on("change", (event: { value: boolean }) => onChange(event.value));
}
