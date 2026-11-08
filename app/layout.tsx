import type { Metadata } from "next";
import "./globals.css";
import { inter, radley } from "./fonts";
import { TrackProvider } from "@/components/TrackContext";

export const metadata: Metadata = {
  title: "Oryx Institute — Safety Academy & SafeMan by Oryx",
  description:
    "Dual-brand occupational health & safety education for Namibian industry: Oryx Safety Academy (NQF Levels 1-7) and SafeMan by Oryx (SAMTRAC-style corporate suite).",
  metadataBase: new URL("https://oryxinstitute.org"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${radley.variable}`}>
      <body>
        <TrackProvider>{children}</TrackProvider>
      </body>
    </html>
  );
}
