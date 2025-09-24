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
      <circle cx="20" cy="20" r="20" fill="#1A3A4A" />
      <path d="M15.336 29L10.32 11.2H13.232L16.592 24.188L19.934 11.2H22.754L27.68 29H24.89L23.558 24.368H19.382L18.068 29H15.336ZM20.846 22.064H22.1L21.464 19.808C21.32 19.316 21.14 18.68 20.924 17.9C20.726 17.12 20.546 16.328 20.384 15.524H20.312C20.15 16.328 19.97 17.12 19.772 17.9C19.574 18.68 19.394 19.316 19.232 19.808L18.596 22.064H19.85Z" fill="#EAE2D7" />
    </svg>
  );
}
