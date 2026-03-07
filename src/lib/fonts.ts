import localFont from "next/font/local";

export const shobhika = localFont({
  src: [
    {
      path: "../../public/fonts/shobhika/Shobhika-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/shobhika/Shobhika-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-shobhika",
  display: "swap",
});
