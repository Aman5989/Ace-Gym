export default function AdminLoading() {
  return (
    <main className="ace-shell min-h-screen overflow-hidden bg-linear-to-br from-[#05071a] via-[#0a0e27] to-[#100828]">
      <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-6 sm:px-6 sm:py-10">
        <section className="relative min-h-[330px] animate-pulse overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl md:p-10">
          <div className="h-10 w-48 rounded-xl bg-white/10" />
          <div className="mt-5 h-12 max-w-md rounded-xl bg-white/10" />
          <div className="mt-4 h-5 max-w-sm rounded-lg bg-white/10" />
          <div className="absolute bottom-8 left-8 right-8 flex gap-3 border-t border-white/10 pt-5">
            <div className="h-11 w-36 rounded-xl bg-white/10" />
            <div className="h-11 w-32 rounded-xl bg-white/10" />
          </div>
        </section>
        <section className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="h-7 w-52 rounded-lg bg-white/10" />
          <div className="mt-6 h-24 rounded-2xl bg-white/10" />
        </section>
        <section className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="h-7 w-64 rounded-lg bg-white/10" />
          <div className="mt-6 h-72 rounded-2xl bg-white/10" />
        </section>
      </div>
    </main>
  );
}
