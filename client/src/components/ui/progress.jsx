import { Progress } from "./progress";

function DownloadProgress() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-2">
      <Progress value={progress} />
      <p className="text-sm">{progress}% complete</p>
    </div>
  );
}