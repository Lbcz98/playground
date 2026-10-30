// The root repo is Vite and has no `next`; screens in web/protos import `next/link`. This is the type the root tsc
// (npm run typecheck, check:laws) sees. web/ resolves the real one; the render harness aliases it to next-link.tsx.
declare module 'next/link' {
  const Link: (props: { href: string; children?: import('react').ReactNode; style?: import('react').CSSProperties; className?: string; 'aria-label'?: string }) => import('react').ReactElement | null
  export default Link
}
