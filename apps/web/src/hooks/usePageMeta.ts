import { useEffect } from "react";

const BRAND_NAME = "Fleet Platform";

function setMetaContent(selector: string, content: string) {
  document.querySelector(selector)?.setAttribute("content", content);
}

export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    const fullTitle = `${title} | ${BRAND_NAME}`;
    document.title = fullTitle;

    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[property="og:title"]', fullTitle);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[name="twitter:title"]', fullTitle);
    setMetaContent('meta[name="twitter:description"]', description);
  }, [title, description]);
}
