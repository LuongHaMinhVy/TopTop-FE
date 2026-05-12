import UploadVideo from '@/components/video/UploadVideo';

export default function StudioUploadPage() {
  return (
    <div className="py-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Upload video</h1>
        <p className="text-zinc-500">Post a video to your account</p>
      </div>
      <UploadVideo />
    </div>
  );
}
