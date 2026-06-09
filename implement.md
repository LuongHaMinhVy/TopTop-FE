# Implementation Notes — Replace any with specific types

## 1. Summary

Replaced `any` with specific types to improve type safety, code readability, and developer experience in the chat and live modules.

## 2. Specs used

- User request: "sửa hết các chỗ any dùng type cụ thể" (fix all places where any is used to use a specific type)

## 3. Project conventions detected

- Architecture: Monorepo workspace with Next.js frontend and Spring Boot backend.
- UI pattern: React hooks integrated with React Query (`useQuery`, `useMutation`, `useInfiniteQuery`) and Redux for global auth state.
- API pattern: typed service layers calling axios instance wrapper.

## 4. Files changed

- `front/apps/web/types/live.ts` — Defined `LiveSocketEvent` interface.
- `front/apps/web/hooks/chat-hooks.ts` — Typed `newData.type` as `MessageType`, typed `old` and `oldData` in `setQueryData` callback as `InfiniteData<ApiResponse<MessageResponseDTO[]>, number>`.
- `front/apps/web/hooks/live-hooks.ts` — Typed `onEvent` as `(event: LiveSocketEvent) => void`, typed `oldData` in `setQueryData` as `InfiniteData<ApiResponse<LiveChatMessageResponse[]>, number>`, and typed `["live", livestreamId]` cache updates as `ApiResponse<LivestreamResponse>`.
- `front/apps/web/services/live-api-service.ts` — Removed `any` from `catch` block and properly cast axios error using `AxiosError`.

## 5. Decisions not explicitly in the spec

- Defined `LiveSocketEvent` to properly type incoming WebSocket messages in the live stream.

## 6. Changes required by existing code

- Added type arguments to react-query's `queryClient.setQueryData` calls to ensure type inference works correctly in callback parameters.

## 7. Trade-offs

- None.

## 8. Deviations from spec

- None.

## 9. Data / API / schema notes

- None.

## 10. Testing and verification

- `pnpm --filter=web check-types` — Passed.
- `pnpm --filter=web lint` — Passed.

## 11. Known limitations and follow-up

- None.
