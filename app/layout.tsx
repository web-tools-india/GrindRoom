import "./globals.css";

export const metadata = {
  title: "GrindRoom — Grind Together, Silently",
  description:
    "Join a room. Declare your task. Grind with real people silently.",
};

export const viewport = {
  themeColor: "#08090E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
