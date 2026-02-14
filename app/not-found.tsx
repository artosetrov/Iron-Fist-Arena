import Image from "next/image";
import Link from "next/link";

const NotFoundPage = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center text-white px-4 overflow-hidden bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('/images/buildings/Stray City.png')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/50" aria-hidden="true" />

      <div className="relative z-10 text-center space-y-6 max-w-lg">
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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-3 font-bold uppercase tracking-wider text-white shadow-md shadow-amber-900/30 transition-all hover:from-amber-500 hover:to-orange-500 active:scale-[0.98]"
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
