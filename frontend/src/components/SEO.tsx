import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  robots?: string;
  ogType?: string;
  ogImage?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  robots = 'index, follow',
  ogType = 'website',
  ogImage = 'https://drop.localreach.in/logo.png',
}) => {
  useEffect(() => {
    // 1. Update document title
    document.title = title;

    // Helper to find or create a meta tag
    const setMetaTag = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (selector.startsWith('meta[name=')) {
          const match = selector.match(/name="([^"]+)"/);
          if (match) el.setAttribute('name', match[1]);
        } else if (selector.startsWith('meta[property=')) {
          const match = selector.match(/property="([^"]+)"/);
          if (match) el.setAttribute('property', match[1]);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    // 2. Standard Meta Tags
    setMetaTag('meta[name="description"]', 'content', description);
    setMetaTag('meta[name="robots"]', 'content', robots);
    setMetaTag('meta[name="googlebot"]', 'content', robots);

    // 3. Canonical URL
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute('href', canonical);
    } else if (canonicalEl) {
      // Remove canonical tag if the route is non-indexable or temporary (e.g. /f/:token)
      canonicalEl.remove();
    }

    // 4. Open Graph Tags
    setMetaTag('meta[property="og:title"]', 'content', title);
    setMetaTag('meta[property="og:description"]', 'content', description);
    setMetaTag('meta[property="og:url"]', 'content', canonical || 'https://drop.localreach.in/');
    setMetaTag('meta[property="og:type"]', 'content', ogType);
    setMetaTag('meta[property="og:image"]', 'content', ogImage);

    // 5. Twitter Card Tags
    setMetaTag('meta[name="twitter:title"]', 'content', title);
    setMetaTag('meta[name="twitter:description"]', 'content', description);
    setMetaTag('meta[name="twitter:url"]', 'content', canonical || 'https://drop.localreach.in/');
    setMetaTag('meta[name="twitter:image"]', 'content', ogImage);
  }, [title, description, canonical, robots, ogType, ogImage]);

  return null;
};

export default SEO;
