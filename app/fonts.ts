import localFont from "next/font/local";

export const radley = localFont({
  src: [
    { path: "../public/fonts/Radley-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Radley-Italic.ttf", weight: "400", style: "italic" },
  ],
  variable: "--font-radley",
  display: "swap",
});

export const inter = localFont({
  src: [
    { path: "../public/fonts/Inter-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Inter-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/Inter-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/Inter-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});
