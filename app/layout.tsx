import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "TMN HR",
  description: "Employee management: hiring to retirement",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={plex.variable} suppressHydrationWarning>
      <head>
        {/* set the theme before first paint so there is no flash */}
        <script dangerouslySetInnerHTML={{ __html: 'try{var t=localStorage.getItem("theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t}catch(e){}' }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
