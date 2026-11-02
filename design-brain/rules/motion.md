# Motion

Applies when: the option is interactive, or it shows a transition.

Simple dissolve only, to show a transition between screens or states, with `--motion-semantic-duration` and `--motion-semantic-easing`. *Why: the screen must work without it.*

Nothing depends on animation to be understood. A static cue (colour, icon, label) stays when motion does not run. Where something moves, a `prefers-reduced-motion` rule exists.

Don't: a transition the screen needs in order to work; motion that ignores reduced motion.
