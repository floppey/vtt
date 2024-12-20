"use client";
import { generateGuid } from "@/util/generateGuid";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    setSessionId(generateGuid());
  }, []);

  return (
    <>
      <div id="new-game">
        <h1>New Game</h1>
        <Link href="/local">Start new local game</Link>
        <br />
        {sessionId && (
          <Link href={`/session/${sessionId}}`}>Start new coop game</Link>
        )}
      </div>
    </>
  );
}
