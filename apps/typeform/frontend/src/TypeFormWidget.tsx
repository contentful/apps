import React, { useEffect, useRef } from 'react';
import * as typeformEmbed from '@typeform/embed';

interface Props {
  src: string;
}

export function TypeformPreviewWidget({ src }: Props) {
  const el = useRef(null);

  useEffect(() => {
    let element = el.current;
    typeformEmbed.makeWidget(element, src, {
      hideFooter: true,
      hideHeaders: true,
      opacity: 0
    });
  }, [src]);

  return (
    <div
      ref={el}
      style={{
        width: '100%',
        height: 450
      }}
    />
  );
}
