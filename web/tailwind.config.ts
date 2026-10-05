import type { Config } from 'tailwindcss'
import root from '../tailwind.config'

/** The root theme (tokens only), pointed at this app's files and the kit's. */
export default { ...root, content: ['./app/**/*.{ts,tsx}', './protos/**/*.{ts,tsx}', '../src/**/*.{ts,tsx}'] } satisfies Config
