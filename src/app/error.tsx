"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main id="main" className="shell empty-site"><p className="eyebrow">Temporarily unavailable</p><h1>Let’s try that again<span className="teal">.</span></h1><p>The content could not be loaded. Please try again in a moment.</p><button className="button primary" onClick={reset}>Retry</button></main>; }
