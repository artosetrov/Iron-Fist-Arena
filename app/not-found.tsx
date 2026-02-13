import Image from "next/image";
import Link from "next/link";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white px-4">
      <div className="text-center space-y-6 max-w-lg">
        <Image
          src="/images/ui/404.png"
          alt="Lost knight holding a crossed-out map with a laughing goblin"
          width={400}
          height={400}
          className="mx-auto drop-shadow-2xl"
          priority
        />

        <h1 className="font-display text-6xl font-bold uppercase tracking-tight text-amber-400 drop-shadow-lg">
          404
        </h1>

        <p className="text-lg text-slate-300 leading-relaxed">
          Похоже, ты заблудился, воин! Эта страница не найдена —
          <br />
          даже гоблин смеётся над твоей картой.
        </p>

        <Link
          href="/hub"
          className="inline-flex items-center gap-2 px-8 py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 rounded-xl font-display text-xl shadow-lg shadow-amber-900/40 transition-all duration-200 hover:scale-105"
          aria-label="Вернуться в хаб"
          tabIndex={0}
        >
          Вернуться в хаб
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
