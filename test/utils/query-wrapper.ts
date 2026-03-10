import React from "react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryFunction,
} from "@tanstack/react-query";

interface CreateQueryWrapperOptions {
  defaultQueryFn?: QueryFunction;
}

/**
 * Creates a fresh QueryClient + wrapper for testing hooks that depend on TanStack Query.
 * Each call returns a new QueryClient instance to prevent shared state between tests.
 */
export function createQueryWrapper(options?: CreateQueryWrapperOptions) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        ...(options?.defaultQueryFn ? { queryFn: options.defaultQueryFn } : {}),
      },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }
  return { queryClient, wrapper: Wrapper };
}
