"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const ads = [
  "Anuncie aqui! Sua marca em destaque para nossos usuários.",
  "Soluções em tecnologia e gestão? Fale com a Alternativa Solutions!",
  "Precisando de um sistema personalizado? Nós desenvolvemos para você.",
];

export function FooterAd() {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
        setIsFading(false);
      }, 500); // Duration of the fade-out animation
    }, 5000); // Change ad every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-muted/60 p-4 text-center text-sm text-muted-foreground backdrop-blur-sm overflow-hidden">
      <div
        className={cn(
          "transition-opacity duration-500 ease-in-out",
          isFading ? "opacity-0" : "opacity-100"
        )}
      >
        {ads[currentAdIndex]}
      </div>
    </footer>
  );
}
