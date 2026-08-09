/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#271b16',
    tint: '#f5b72f',

    // Core surfaces
    background: '#102b2f',
    foreground: '#fff9e9',

    // Cards / elevated surfaces
    card: '#1d4140',
    cardForeground: '#fff9e9',

    // Primary action color (buttons, links, active states)
    primary: '#f5b72f',
    primaryForeground: '#271b16',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#2d5c53',
    secondaryForeground: '#fff9e9',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#204745',
    mutedForeground: '#b9d0bd',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#e85f3f',
    accentForeground: '#fff9e9',

    // Destructive actions (delete, error states)
    destructive: '#e85f3f',
    destructiveForeground: '#fff9e9',

    // Borders and input outlines
    border: '#467568',
    input: '#467568',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 14,
};

export default colors;
