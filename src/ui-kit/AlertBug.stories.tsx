import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Stack, Text, spacing, token } from '@/primitives'
import { AlertBug, AlertBugAnchor, type AlertBugMotion } from './AlertBug'
import { ScreenOverlay } from './Overlay'
import globoMark from './story-assets/bug-globo.png'

/** The bug sits in the bottom-right corner of the clean broadcast. */
const backdrop: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'flex-end',
  padding: spacing('xl'),
  backgroundColor: token('--color-semantic-theme-noite-light'),
}

function Screen({ children }: { children: ReactNode }): ReactNode {
  return <div style={{ ...backdrop, width: '100vw', height: '100vh' }}>{children}</div>
}

const meta = {
  title: 'UI Kit/Alert Bug',
  component: AlertBug,
  parameters: { layout: 'fullscreen', docs: { story: { inline: false, height: '34em' } } },
  argTypes: {
    bugStyle: { control: 'inline-radio', options: ['interface', 'transmission'] },
    interactionState: { control: 'inline-radio', options: ['default', 'focus'] },
    motion: { control: 'inline-radio', options: [undefined, 'enter', 'stay', 'exit', 'cycle'] },
  },
  decorators: [
    (Story) => (
      <Screen>
        <Story />
      </Screen>
    ),
  ],
} satisfies Meta<typeof AlertBug>

export default meta
type Story = StoryObj<typeof meta>

/** The kit's own bug, waiting to be reached. */
export const Interface: Story = { args: { bugStyle: 'interface', interactionState: 'default' } }
/** The same bug once it holds the focus — it grows and takes the focus ring. */
export const InterfaceFocus: Story = { args: { bugStyle: 'interface', interactionState: 'focus' } }
/** The broadcaster's own mark, laid over the picture by the transmission. */
export const Transmission: Story = { args: { bugStyle: 'transmission' } }

/** Every style side by side. */
export const AllStyles: Story = {
  args: {},
  decorators: [(Story) => <Story />],
  render: () => (
    <div style={{ ...backdrop, alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw' }}>
      <Stack direction="row" gap="2xl" align="center">
        {(
          [
            ['interface', 'default'],
            ['interface', 'focus'],
            ['transmission', 'default'],
          ] as const
        ).map(([bugStyle, state]) => (
          <Stack key={`${bugStyle}-${state}`} gap="2xs" align="center">
            <AlertBug bugStyle={bugStyle} interactionState={state} />
            <Text variant="footnote-medium" color="secondary">
              {`${bugStyle} · ${state}`}
            </Text>
          </Stack>
        ))}
      </Stack>
    </div>
  ),
}

/**
 * The bug as the viewer meets it: a 16:9 frame of the broadcast (layer 0), the `alert`
 * screen's bottom-right shade behind it for contrast, and the bug laid on top of the
 * Globo's own mark. Not a button for the viewer to press yet — only the motion.
 */
const FRAME_WIDTH = 1280
const FRAME_HEIGHT = 720

const frame: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  width: FRAME_WIDTH,
  height: FRAME_HEIGHT,
  transformOrigin: 'top left',
  background: `linear-gradient(160deg, ${token('--color-semantic-theme-noite-dark')} 0%, ${token('--color-semantic-theme-dia-light')} 55%, ${token('--color-semantic-theme-tarde-light')} 100%)`,
}

/** The kit's sizes are for its own 1280×720 frame (HD), so the frame is drawn at that size and scaled to fit the window. */
function useFit(): number {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = (): void => setScale(Math.min(window.innerWidth / FRAME_WIDTH, window.innerHeight / FRAME_HEIGHT))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return scale
}

function Broadcast({ children }: { children: ReactNode }): ReactNode {
  const scale = useFit()
  return (
    <div style={{ width: FRAME_WIDTH * scale, height: FRAME_HEIGHT * scale, overflow: 'hidden' }}>
      <div style={{ ...frame, transform: `scale(${scale})` }} data-testid="frame">
        <ScreenOverlay model="alert" />
        {children}
      </div>
    </div>
  )
}

function MotionStage({ motion }: { motion: AlertBugMotion }): ReactNode {
  const [run, setRun] = useState(0)
  return (
    <Broadcast>
      <AlertBugAnchor>
        <AlertBug key={`${motion}-${run}`} bugStyle="transmission" src={globoMark} motion={motion} />
      </AlertBugAnchor>
      <div style={{ position: 'absolute', top: spacing('lg'), left: spacing('lg') }}>
        <button type="button" onClick={() => setRun(run + 1)}>
          Replay
        </button>
      </div>
    </Broadcast>
  )
}

/**
 * The whole life of the bug on its own: it comes in over 800ms, stays 8s with the halo
 * turning, and leaves over 800ms. Press Replay to see it again.
 */
export const Cycle: Story = {
  args: { motion: 'cycle' },
  decorators: [(Story) => <Story />],
  render: () => <MotionStage motion="cycle" />,
  play: async ({ canvasElement }) => {
    const bug = canvasElement.querySelector('.sfs-alert-bug')
    await expect(bug?.getAttribute('data-motion')).toBe('cycle')
    await expect(canvasElement.querySelector('.sfs-alert-bug-halo')).not.toBeNull()
    await expect(canvasElement.querySelector('.sfs-alert-bug-text')?.textContent).toContain('interativo')
  },
}

/** Only the entrance: the mark fades and scales up, the halo opens and the text rises from behind the mark. */
export const Enter: Story = {
  args: { motion: 'enter' },
  decorators: [(Story) => <Story />],
  render: () => <MotionStage motion="enter" />,
}

/** Only the exit: the mark and halo scale down and the text drops back behind the mark, all of them 100 → 0. */
export const Exit: Story = {
  args: { motion: 'exit' },
  decorators: [(Story) => <Story />],
  render: () => <MotionStage motion="exit" />,
}

/** The settled composition, the one the viewer sees for 8s: the halo is the only thing moving. */
export const Stay: Story = {
  args: { motion: 'stay' },
  decorators: [(Story) => <Story />],
  render: () => <MotionStage motion="stay" />,
}

/** With reduced motion the bug only dissolves in and out: no scale, no rise, no spin. */
export const ReducedMotion: Story = {
  args: { motion: 'cycle', reducedMotion: true },
  decorators: [(Story) => <Story />],
  render: () => (
    <Broadcast>
      <AlertBugAnchor>
        <AlertBug bugStyle="transmission" src={globoMark} motion="cycle" reducedMotion />
      </AlertBugAnchor>
    </Broadcast>
  ),
}

/** One guide line per margin, drawn where the spec puts them. */
const guide: CSSProperties = {
  position: 'absolute',
  borderColor: token('--color-semantic-theme-tarde-dark'),
  borderStyle: 'dashed',
  borderWidth: 0,
  pointerEvents: 'none',
}

/**
 * Where it sits: over the Globo's mark, in the bottom-right corner. The margins are the
 * sphere's edge to the edge of the frame — **79 px to the right and 37 px to the bottom on
 * 1280×720 (HD); 118 px and 56 px on 1920×1080 (FHD)** — never the halo's or the text's. The
 * sphere is 82 px (FHD 124 px) and the halo 102 px (FHD 152 px). The two margins are held as
 * percentages of the frame (6.1458% and 5.1852%).
 */
export const Position: Story = {
  args: { motion: 'stay' },
  decorators: [(Story) => <Story />],
  render: () => (
    <Broadcast>
      <AlertBugAnchor>
        <AlertBug bugStyle="transmission" src={globoMark} motion="stay" />
      </AlertBugAnchor>
      <div style={{ ...guide, top: 0, bottom: 0, right: '6.1458%', borderLeftWidth: 1, borderRightWidth: 0 }} />
      <div style={{ ...guide, left: 0, right: 0, bottom: '5.1852%', borderTopWidth: 1 }} />
      <div style={{ position: 'absolute', top: spacing('lg'), left: spacing('lg') }}>
        <Text variant="footnote-medium" color="primary">
          Sphere 82, halo 102, margins 79 and 37 on 1280×720 (HD) — 124, 152, 118 and 56 on 1920×1080 (FHD)
        </Text>
      </div>
    </Broadcast>
  ),
  play: async ({ canvasElement }) => {
    const frameBox = canvasElement.querySelector('[data-testid="frame"]')?.getBoundingClientRect()
    const bugBox = canvasElement.querySelector('.sfs-alert-bug')?.getBoundingClientRect()
    if (!frameBox || !bugBox) throw new Error('frame or bug missing')
    await expect((frameBox.right - bugBox.right) / frameBox.width).toBeCloseTo(118 / 1920, 3)
    await expect((frameBox.bottom - bugBox.bottom) / frameBox.height).toBeCloseTo(56 / 1080, 3)
    // The sphere is 82 of 1280 (124 of 1920) and the halo 102 of 1280 (152 of 1920): the same share of the frame.
    const haloBox = canvasElement.querySelector('.sfs-alert-bug-halo')?.getBoundingClientRect()
    await expect(bugBox.width / frameBox.width).toBeCloseTo(82 / 1280, 3)
    await expect((haloBox?.width ?? 0) / frameBox.width).toBeCloseTo(102 / 1280, 3)
  },
}
