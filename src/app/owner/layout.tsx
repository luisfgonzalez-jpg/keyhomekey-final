// src/app/owner/layout.tsx
import React from 'react';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </div>
    </section>
  );
}
