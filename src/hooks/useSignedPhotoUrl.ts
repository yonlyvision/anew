import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { getSignedPhotoUrls } from "@/lib/profile.functions";

export function useSignedPhotoUrls(paths: Array<string | null | undefined>) {
  const fetchSignedUrls = useServerFn(getSignedPhotoUrls);
  const [urls, setUrls] = useState<Record<string, string | null>>({});

  const cleanPaths = useMemo(
    () =>
      Array.from(
        new Set(
          paths.filter((path): path is string => typeof path === "string" && path.trim().length > 0),
        ),
      ),
    [paths],
  );

  const key = cleanPaths.join("|");

  useEffect(() => {
    let active = true;

    if (cleanPaths.length === 0) {
      setUrls({});
      return () => {
        active = false;
      };
    }

    fetchSignedUrls({ data: { paths: cleanPaths } })
      .then((result) => {
        if (active) setUrls(result.urls ?? {});
      })
      .catch(() => {
        if (active) setUrls({});
      });

    return () => {
      active = false;
    };
  }, [fetchSignedUrls, key]);

  return { urls };
}

export function useSignedPhotoUrl(path: string | null | undefined) {
  const safePath = path ?? null;
  const { urls } = useSignedPhotoUrls(safePath ? [safePath] : []);
  return safePath ? (urls[safePath] ?? null) : null;
}
