export function videoPath(
  username: string,
  videoId: number,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  const query = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });

  const suffix = query.toString();
  return `/@${username}/video/${videoId}${suffix ? `?${suffix}` : ""}`;
}
