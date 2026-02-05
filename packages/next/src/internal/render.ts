import React from 'react';
import { toJsonLdString } from '@ranklabs/schema';

export type RenderJsonLdProps = {
  data: unknown;
  id?: string;
};

export function RenderJsonLd({ data, id }: RenderJsonLdProps) {
  if (!data) return null;
  return React.createElement('script', {
    id,
    type: 'application/ld+json',
    dangerouslySetInnerHTML: {
      __html: toJsonLdString(data, { pretty: false, escapeForHtml: true }),
    },
  });
}

export function JsonLdSchema({ data, id }: { data: unknown; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id,
    data,
  });
}
