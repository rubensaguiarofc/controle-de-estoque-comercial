"use client";
import React, { useEffect, useRef } from "react";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

type Props = {
  onCredential?: (response: any) => void;
};

export default function GoogleSignIn({ onCredential }: Props) {
  const btnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!clientId) return;

    // Append GIS script if not already present
    if (!document.getElementById("google-identity-script")) {
      const script = document.createElement("script");
      script.id = "google-identity-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => initializeButton();
    } else {
      initializeButton();
    }

    function initializeButton() {
      try {
        const google = (window as any).google;
        if (!google || !btnRef.current) return;

        // @ts-ignore
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (res: any) => {
            // helpful debug logging (will appear in browser console)
            try {
              console.debug('Google credential received', res);
            } catch (e) {
              /* ignore */
            }
            // call provided handler if present
            if (onCredential) {
              onCredential(res);
            } else if ((window as any).handleCredentialResponse) {
              (window as any).handleCredentialResponse(res);
            }
          },
          ux_mode: "popup",
        });

        // Render the button into our container
        google.accounts.id.renderButton(btnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 384,
        });
      } catch (e) {
        console.warn("Google Identity Services init failed", e);
      }
    }
  }, []);

  return <div ref={btnRef} className="mx-auto" />;
}
