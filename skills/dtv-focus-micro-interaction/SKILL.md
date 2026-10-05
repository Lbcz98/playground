---
name: dtv-focus-micro-interaction
description: Use when a screen has focusable controls on DTV, operated by remote control. Covers where focus starts, how it moves, where it returns and how it looks and animates.
autonomy: autonomous
---

# DTV focus and micro-interaction

This skill covers focus on DTV, where the person navigates with a remote control and focus is the only pointer. It states the intent behind each focus rule so you can decide the cases the rules book does not list. Where this skill and the rules book disagree, the rules book wins.

## Focus exists only where there is an action

Focus is the tool of an action. A screen with nothing to act on has no focus, and nothing else takes it. When a control stops existing, focus does not move to a neighbour.

## Where focus starts

| Level | Focus starts on | Why |
| --- | --- | --- |
| 0, the broadcast | Nothing, unless a notification appears. Then it starts on the notification | There is nothing to act on otherwise |
| 1, home | The program button | Contextual interactivities show up as the lure |
| 2 | The first item of the rail, on the side the rail is anchored: the rightmost item for a rail on the right, the leftmost for a rail on the left | Focus enters from the rail's own side |
| 3, where interactivities live | The back button | The person always has an exit in reach |

When a notification leaves level 0, focus ceases to exist. It does not land on another element.

## How focus moves

- **Rail edges.** At the first or last item of a rail, focus stays. It never wraps and never leaves the rail. The opposite direction moves it back.
- **Down on level 2.** The down arrow returns to level 1 and puts focus on the program button.

## Focus returns to where it left

Going back one level restores focus to the control that opened the level you left. If the person opened interactivity X from level 2, focus returns to X, not to the first item. The entry rule in the table above applies only on the first arrival at a level.

So treat every control that opens a next level as the return target for that level. How the blueprint expresses it is defined by the validator, not here.

## What focus looks like

Focus does not change the control's scale. The ring changes the border's thickness and colour, over an inset fill that fades up from the bottom, with a glow pooling from the bottom edge.

Use `FocusRing` and give it the control's `shape`. Never draw a focus treatment by hand. Every value comes from a semantic token, and this skill quotes none of them: read them from the token lookup.

## How focus moves visually

- **One curve.** Every transition in the system, including a change of screen, uses the one system spring, `motion.semantic.easing`: a custom spring that settles in 800 ms without overshoot. Never write another duration or easing.
- **The colour cycle.** While a control is focused, the ring and its glow walk noite, dia, tarde, dia and loop. Each leg is `motion.semantic.focus-cycle-step` and the loop is `motion.semantic.focus-cycle-duration`, eased on the system spring. It returns through dia so the loop has no cut.
- **Reduced motion.** The ring keeps its static gradient and does not cycle.

## What is not defined yet

The default behaviour of a click or select is not defined. Do not add press animation of your own, such as a scale or a bounce.

## Before you finish

| Mistake | Fix |
| --- | --- |
| Focus on a level 0 screen with no notification | No focus at all |
| Level 2 focus starts on the wrong end of the rail | Start on the rail's anchored side |
| Level 3 focus starts on content | Start on the back button |
| Focus wraps at the end of a rail | Stop at the edge |
| Returning to level 2 lands on the first item | Restore the control that opened the level |
| Focus scales the control | Change border thickness and colour only |
| A hand-picked duration, easing or hex colour | Use the motion and colour tokens |
| A hand-built focus ring | Use `FocusRing` |

## Hand-off

Token values come from the token lookup. Which focus positions are checked as laws comes from the rules book. Motion outside focus belongs to the motion skill.
