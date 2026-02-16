import React, { useEffect } from 'react';

const AdBanner: React.FC = () => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, []);

  return (
    <div className="w-full mt-10 mb-6 flex flex-col items-center gap-2 overflow-hidden animate-fade-in">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-50">Publicidade</span>
      <div className="w-full max-w-4xl bg-slate-100/30 dark:bg-white/5 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800 min-h-[100px] flex items-center justify-center">
        {/* Container do AdSense */}
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%' }}
             data-ad-client="ca-pub-6403370988033052"
             data-ad-slot="auto"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
};

export default AdBanner;