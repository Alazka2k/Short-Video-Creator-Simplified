import { ComponentType } from 'react';

export type ProtectedComponent<P = {}> = ComponentType<P> & {
  requireAuth?: boolean;
  redirectTo?: string;
};