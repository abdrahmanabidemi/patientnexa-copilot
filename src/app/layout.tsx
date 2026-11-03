import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PatientNexa Copilot — Outpatient Follow-Up Assistant',
  description:
    'AI-assisted clinic follow-up copilot prioritizing outpatient recall queues with transparent workflow rules and human-in-the-loop review.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
