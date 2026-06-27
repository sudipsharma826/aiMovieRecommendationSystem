"use client";

import { useEffect, useId, useRef } from "react";
import Script from "next/script";

type AdSenseBannerProps = {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
};

const getAdsense = () => (window as any).adsbygoogle;

export function AdSenseBanner({
  slot,
  format = "auto",
}: AdSenseBannerProps) {
  const adClient = process.env.NEXT_PUBLIC_AD_CLIENT_ID;
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);
  const uniqueId = useId();

  if (!adClient) {
    console.warn("NEXT_PUBLIC_AD_CLIENT_ID is not defined.");
    return null;
  }

  useEffect(() => {
    if (pushedRef.current) return;

    const pushAd = () => {
      if (!insRef.current) return;

      const rect = insRef.current.getBoundingClientRect();
      const availableWidth = rect.width || rect.right - rect.left;

      if (availableWidth <= 0) {
        requestAnimationFrame(() => pushAd());
        return;
      }

      try {
        const ads = (getAdsense() as any) || [];
        (window as any).adsbygoogle = ads;
        ads.push({});
        pushedRef.current = true;
      } catch (err) {
        console.error("AdSense push error:", err);
      }
    };

    const timer = window.setTimeout(() => {
      pushAd();
    }, 300);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="my-6 flex justify-center">
      <Script
        id="adsense-script"
        async
        strategy="afterInteractive"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
        crossOrigin="anonymous"
      />

      <ins
        ref={insRef}
        className={`adsbygoogle ${uniqueId}`}
        style={{ display: "block" }}
        data-ad-client={adClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}