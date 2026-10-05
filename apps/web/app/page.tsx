export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Welcome to ChessArena</p>
        <h1>Play smarter. Compete harder.</h1>
        <p className="subtitle">
          A modern chess arena for online matches, live game rooms, rankings, and tournament play.
        </p>
        <div className="cta-row">
          <button type="button">Play now</button>
          <button type="button" className="secondary">Browse tournaments</button>
        </div>
      </section>
    </main>
  );
}
