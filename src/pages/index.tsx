import { generateGuid } from "@/util/generateGuid";
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>VTT</title>
        <meta name="description" content="VTT Demo" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div id="new-game">
        <h1>
          New Game
        </h1>
        <Link href={`/${generateGuid()}`}>
          Start new game
        </Link>
      </div>
    </>
  );
}
