# Icons

Applies when: every card. Explorations do not use SVG for icons.

The kit's `src/ui-kit/icons/*.svg` are only the source. An icon the option needs (a kit icon or one drawn for the option) is converted with `node scripts/icon-to-png.mjs <icon.svg> docs/explorations/<slug>/assets/<name>.png --size <px>` and used as `<img>` or as a CSS `mask-image`, so the kit's colour tokens still apply. No inline `<svg>` and no `.svg` file for an icon.

Charts and larger drawings are not icons and may stay inline. An `<svg>` rendered at 64px or less, or a `.svg` referenced by `<img>` or `url()`, is the break. The layout check prints it as `svg`.
