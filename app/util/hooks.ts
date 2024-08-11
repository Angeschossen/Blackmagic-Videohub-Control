import { useState } from "react";
import { getRandomKey } from "./commonutils";

export function useForceUpdate() {
    const [value, setValue] = useState(0);
    return () => setValue(getRandomKey());
}