"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Track } from "@/lib/brand";

interface TrackCtx {
  track: Track;
  setTrack: (t: Track) => void;
  catalogue: import("@/lib/brand").Catalogue | null;
}

const Ctx = createContext<TrackCtx>({ track: "academy", setTrack: () => {}, catalogue: null });
export const TRACK_KEY = "oryx-track";

export function TrackProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrackState] = useState<Track>("academy");
  const [catalogue, setCatalogue] = useState<TrackCtx["catalogue"]>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(TRACK_KEY);
    if (saved === "safeman" || saved === "academy") setTrackState(saved);
    fetch("/data/courses.json")
      .then((r) => r.json())
      .then(setCatalogue)
      .catch(() => setCatalogue(null));
  }, []);

  const setTrack = useCallback((t: Track) => {
    setTrackState(t);
    window.localStorage.setItem(TRACK_KEY, t);
    document.body.setAttribute("data-track", t);
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-track", track);
  }, [track]);

  return <Ctx.Provider value={{ track, setTrack, catalogue }}>{children}</Ctx.Provider>;
}

export function useTrack(): TrackCtx {
  return useContext(Ctx);
}
