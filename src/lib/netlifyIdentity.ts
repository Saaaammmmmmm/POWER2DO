declare global {
  interface Window {
    netlifyIdentity?: {
      init: () => void;
      open: () => void;
      close: () => void;
      logout: () => void;
      login: (opts?: { provider?: string }) => void;
      on: (event: string, callback: (...args: any[]) => void) => void;
      currentUser: () => { id?: string; email?: string; user_metadata?: { full_name?: string } } | null;
    };
  }
}

export const netlifyIdentityEnabled = typeof window !== 'undefined' && !!window.netlifyIdentity;

export function loadNetlifyIdentity() {
  if (typeof window === 'undefined') return null;

  if (window.netlifyIdentity) return window.netlifyIdentity;

  const script = document.createElement('script');
  script.src = 'https://identity.netlify.com/v1/netlify-identity-widget.js';
  script.async = true;
  document.body.appendChild(script);

  return null;
}

export function initNetlifyIdentity() {
  if (typeof window === 'undefined') return null;

  if (!window.netlifyIdentity) {
    loadNetlifyIdentity();
    return null;
  }

  window.netlifyIdentity.init();
  return window.netlifyIdentity;
}
