import type { SVGProps } from 'react';

export function SaidaMarisLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2" />
      <path d="M3 14v2a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2" />
      <path d="M12 22V12" />
      <path d="m3.3 9.9 8.7 5 8.7-5" />
      <path d="M3 14h18" />
    </svg>
  );
}

export function A6Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="20" cy="20" r="20" fill="#1A3A4A"/>
        <path d="M15.4883 29.5V11.8H18.9883V23.68H24.8883V11.8H28.3883V29.5H24.8883V17.08H18.9883V29.5H15.4883Z" fill="#EAE2D7" transform="translate(-4, 0) scale(0.9)"/>
        <path d="M37.3117 21.06C37.3117 24.02 36.4317 26.46 34.6717 28.38C32.9317 30.28 30.7317 31.24 28.0717 31.24C25.2917 31.24 23.0117 30.18 21.2317 28.06C19.4517 25.92 18.5617 23.2 18.5617 19.8C18.5617 16.64 19.4317 14.06 21.1717 12.06C22.9117 10.04 25.1717 9.04 27.9517 9.04C30.7517 9.04 32.9717 10.1 34.6117 12.22C36.2717 14.32 37.1017 17.02 37.1017 20.4V21.06H37.3117ZM33.7117 20.68C33.7117 17.84 33.1517 15.62 32.0317 14.02C30.9117 12.42 29.5517 11.62 27.9517 11.62C26.3517 11.62 25.0117 12.4 23.9317 13.96C22.8517 15.52 22.3117 17.68 22.2517 20.44V21.1H33.7117V20.68ZM33.6517 23.56V24.16H22.3117V23.56C22.4317 25.84 23.2717 27.54 24.8317 28.66C26.4117 29.78 28.1117 29.98 29.0317 29.5C30.5917 28.76 31.6717 27.28 32.2717 25.06L33.6517 23.56Z" fill="#EAE2D7" transform="translate(0, -1) scale(0.95)" />
    </svg>
  );
}
