import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Escrow Market — demo",
  description: "Demo UI del marketplace NFT con escrow, fee y tema claro/oscuro",
};

/**
 * Script inline: aplica tema antes del paint para evitar flash.
 */
const themeBootScript = `
(function(){
  try {
    var k='market-theme';
    var t=localStorage.getItem(k);
    if(t!=='light'&&t!=='dark'){
      t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

/**
 * Layout raíz (Server Component).
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
