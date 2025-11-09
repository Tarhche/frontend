'use client';

import NextLink from 'next/link';
import type { ComponentPropsWithoutRef, ForwardedRef } from 'react';
import { forwardRef } from 'react';

export type AppLinkProps = ComponentPropsWithoutRef<typeof NextLink>;

const Link = forwardRef(function Link(
  props: AppLinkProps,
  ref: ForwardedRef<HTMLAnchorElement>
) {
  return <NextLink ref={ref} {...props} />;
});

export default Link;
