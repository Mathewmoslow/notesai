import type { Metadata } from "next";
import { Providers } from './providers';

export const metadata: Metadata = {
  title: "NurseNotes-AI | Study Note Generator",
  description: "Transform nursing source materials into comprehensive, exam-ready study notes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}