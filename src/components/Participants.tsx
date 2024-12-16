import React, { useEffect } from "react";
import { usePresence, usePresenceListener, useAbly } from "ably/react";
import { useVtt } from "@/context/vttContext";
import { useVttChannel } from "@/context/vttChannelContext";

export const Participants: React.FC = () => {
  const ably = useAbly();
  const { vtt } = useVtt();
  const { channel } = useVttChannel();
  usePresence(channel);
  const { presenceData } = usePresenceListener(channel);

  useEffect(() => {
    if (vtt && vtt.websocketClientId !== ably.auth.clientId) {
      vtt.websocketClientId = ably.auth.clientId ?? "unknown";
      vtt.init();
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
    <div id="participants">
      <ul>{presenceList}</ul>
    </div>
  );
};
