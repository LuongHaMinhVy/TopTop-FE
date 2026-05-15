import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ username: string; videoId: string }>;
}) {
  const { username: rawUsername, videoId } = await params;
  const decodedUsername = decodeURIComponent(rawUsername);
  const username = decodedUsername.startsWith("@")
    ? decodedUsername.substring(1)
    : decodedUsername;

  redirect(`/@${username}/video/${videoId}`);
}
