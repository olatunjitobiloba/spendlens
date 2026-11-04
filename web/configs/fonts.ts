import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";

export const aspekta = localFont({
  variable: "--font-aspekta",
  display: "swap",
  src: [
    { path: "../public/fonts/Aspekta-300.otf", weight: "300", style: "normal" },
    { path: "../public/fonts/Aspekta-350.otf", weight: "350", style: "normal" },
    { path: "../public/fonts/Aspekta-400.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/Aspekta-500.otf", weight: "500", style: "normal" },
    { path: "../public/fonts/Aspekta-600.otf", weight: "600", style: "normal" },
    { path: "../public/fonts/Aspekta-650.otf", weight: "650", style: "normal" },
    { path: "../public/fonts/Aspekta-700.otf", weight: "700", style: "normal" },
  ],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});
