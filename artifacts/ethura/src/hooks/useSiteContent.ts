import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { getSiteContent } from "@/lib/siteContent";

export function useSiteContent() {
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    api.siteContent.get().then(setContent).catch(() => {});
  }, []);

  return (key: string) => getSiteContent(content, key);
}
