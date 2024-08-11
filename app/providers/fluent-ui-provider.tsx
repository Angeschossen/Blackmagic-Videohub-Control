'use client';

import * as React from 'react';
import {
  FluentProvider,
  SSRProvider,
  RendererProvider,
  createDOMRenderer,
  renderToStyleElements,
  webLightTheme,
} from '@fluentui/react-components';
import { useServerInsertedHTML } from 'next/navigation';
import { initializeIcons } from '@fluentui/react';

export function FluentUIProvider({ children }: { children: React.ReactNode }) {
  const [renderer] = React.useState(() => createDOMRenderer());
  const didRenderRef = React.useRef(false);

  React.useEffect(() => {
    initializeIcons();
  }, []);
  
  useServerInsertedHTML(() => {
    if (didRenderRef.current) {
      return;
    }
    didRenderRef.current = true;
    return <>{renderToStyleElements(renderer)}</>;
  });

  return (
    <RendererProvider renderer={renderer}>
      <SSRProvider>
        <FluentProvider theme={webLightTheme}>{children}</FluentProvider>
      </SSRProvider>
    </RendererProvider>
  );
}