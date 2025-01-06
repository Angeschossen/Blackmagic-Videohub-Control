import { useState } from "react";
import { getRandomKey } from "./commonutils";
import { RefObject, useEffect } from 'react'

export function useForceUpdate() {
    const [value, setValue] = useState(0);
    return () => setValue(getRandomKey());
}

export const useClickOutside = (
  ref: RefObject<HTMLElement | undefined>,
  callback: () => void
) => {
  const handleClick = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as HTMLElement)) {
      callback()
    }
  }

  useEffect(() => {
    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
    }
  })
}
