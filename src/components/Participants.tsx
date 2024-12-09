import React, { useEffect } from "react";
import { usePresence, usePresenceListener, useAbly } from "ably/react";
import { useVtt } from "@/context/vttContext";

export const Participants: React.FC = () => {
  const ably = useAbly();
  const { vtt } = useVtt();
  const channel = vtt?.websocketChannel ?? "";
  usePresence(channel);
  const { presenceData } = usePresenceListener(channel);

  useEffect(() => {
    if (vtt && vtt.websocketClientId !== ably.auth.clientId) {
      vtt.websocketClientId = ably.auth.clientId ?? "unknown";
    }
  }, [vtt, ably.auth.clientId]);

  const presenceList = presenceData.map((member) => {
    const isItMe = member.clientId === ably.auth.clientId ? "(me)" : "";

    return (
      <li key={member.clientId}>
        <span>{member.clientId}</span>
        <span>{isItMe}</span>
      </li>
    );
  });

  return (
    <div id="participants" className="window window--participants">
      <ul>{presenceList}</ul>
    </div>
  );
};