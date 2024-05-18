
import { Html, Head, Main, NextScript } from 'next/document'


export default function Document() {
  return (
    <Html lang="en" className="h-full">
      <Head >
        <link rel="manifest" href="./manifest.json" />

        <title>Log Chopper</title>
      </Head>
      <body className="h-full">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}