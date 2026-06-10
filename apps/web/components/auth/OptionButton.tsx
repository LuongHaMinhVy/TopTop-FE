export default function OptionBtn({
  icon,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full px-6 py-4 border border-elevated rounded-2xl hover:bg-hover bg-background transition-all duration-200 group active:scale-[0.98]"
    >
      <div className="text-text-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="flex-1 text-center font-bold text-sm text-text-primary">
        {text}
      </span>
    </button>
  );
}