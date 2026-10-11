import { useEffect } from 'react';

const DEFAULT_TITLE = 'Aerlume — Travel, considered';
const SITE_NAME = 'Aerlume';

function setMetaTag(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Sets the document title and meta description/Open Graph tags for the
 * current page. No dependency (react-helmet-async) needed for an app this
 * size — plain useEffect DOM updates are sufficient and avoid the extra
 * bundle weight. Renders nothing.
 */
export default function Seo({ title, description, image }) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;

    if (description) {
      setMetaTag('name', 'description', description);
      setMetaTag('property', 'og:description', description);
    }
    setMetaTag('property', 'og:title', title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE);
    setMetaTag('property', 'og:type', 'website');
    if (image) setMetaTag('property', 'og:image', image);

    // Reset to sane defaults on unmount so navigating to a page without
    // its own <Seo> doesn't leak the previous page's title/description.
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, image]);

  return null;
}
