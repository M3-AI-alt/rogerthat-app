"use client";

import { getClassGroupChatForClass } from "@/lib/chats";
import { useParams, useRouter } from "next/navigation";
import { type ReactElement, useEffect, useState } from "react";

export default function ClassRoomRedirectPage(): ReactElement {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [message, setMessage] = useState("Opening class room...");

  useEffect(() => {
    let isMounted = true;

    async function openRoom() {
      try {
        const room = await getClassGroupChatForClass(params.id);

        if (room) {
          router.replace(`/chats/${room.id}`);
          return;
        }

        if (isMounted) {
          setMessage("No room exists for this class yet. Ask the CEO to create it.");
        }
      } catch {
        if (isMounted) {
          setMessage("Could not open this class room.");
        }
      }
    }

    void openRoom();

    return () => {
      isMounted = false;
    };
  }, [params.id, router]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#efeae2] px-4 text-slate-950">
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm shadow-sm">
        {message}
      </div>
    </main>
  );
}
