import Link from "next/link";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="text-center space-y-6 p-8">
        <div className="text-8xl font-bold text-indigo-400">404</div>
        <h1 className="text-3xl font-bold">Page Not Found</h1>
        <p className="text-slate-400 max-w-md">
          This page doesn&apos;t exist or has been moved. Return to the hub to continue playing.
        </p>
        <Link
          href="/hub"
          className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
          aria-label="Back to Hub"
        >
          Back to Hub
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
