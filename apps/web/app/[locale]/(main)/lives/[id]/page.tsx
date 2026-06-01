import LiveDetailClient from "@/components/lives/LiveDetailClient";

interface LiveDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Live - TikTok",
  description: "Watch this livestream on TikTok",
};

export default async function LiveDetailPage({ params }: LiveDetailPageProps) {
  const { id } = await params;
  return <LiveDetailClient streamId={Number(id)} />;
}
