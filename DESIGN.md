---
name: Pocket Doc
description: A patient interface for symptom assessments and saved reports.
colors:
  background: '#f7f1e5'
  surface: '#fffaf1'
  text: '#193c2c'
  muted: '#4e6050'
  border: '#cbd4c0'
  accent: '#1b5139'
  accent-hover: '#123c2a'
  accent-contrast: '#ffffff'
  focus: '#3b8060'
  warning-background: '#fff6e0'
  error-background: '#fdecec'
  emergency-background: '#b3261e'
  urgent-background: '#fff1d6'
  dark-background: '#151816'
  dark-accent: '#a8d5a5'
typography:
  page-heading:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: 'clamp(28px, 3vw, 38px)'
    lineHeight: 1.15
    letterSpacing: '-0.03em'
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '15px'
    lineHeight: 1.5
  control:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '14px'
    fontWeight: 750
  landing-heading:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: 'clamp(64px, 7.5vw, 110px)'
    lineHeight: 0.9
rounded:
  control: '9px'
  panel: '13px'
  form: '15px'
  landing-guide: '16px'
spacing:
  control-horizontal: '16px'
components:
  button-primary:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.accent-contrast}'
    rounded: '{rounded.control}'
    padding: '0 16px'
  button-primary-hover:
    backgroundColor: '{colors.accent-hover}'
  panel:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.panel}'
  field:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    rounded: '{rounded.control}'
    padding: '11px 12px'
---

# Pocket Doc design guide

## Overview

Use forest green, sage and warm ivory in light mode. Use dark neutral surfaces with green accents in dark mode. A pocket and cross mark identifies Pocket Doc. Keep emergency guidance visible and do not imply that an assessment is
a diagnosis. Radix Themes uses the grass accent, sage neutral and medium radius.

## Colors

Use green for navigation, selection and ordinary actions. Use warm backgrounds and borders to
group content. Use amber for warnings, red for errors and emergencies, and green for success.
Retain the meaning of these states in both light and dark mode.

`src/styles.css` defines the full light and dark palettes. Radix Themes provides its own scales.

## Typography

The public welcome and wordmark use the self-hosted Cormorant Garamond serif. The workspace and
body copy use a system sans-serif stack. The landing heading uses `clamp(64px, 7.5vw, 110px)`
on desktop and a smaller mobile scale.

## Layout

The public home page has a full-width welcome and a simple header. The signed-in desktop shell has a 244px sidebar and a workspace up to 1320px wide. Narrow pages are at most
840px wide. At 900px and below, the sidebar becomes a drawer and multi-column areas stack.

## Shapes

Controls, fields, panels and forms use the radii in the frontmatter. Badges are rounded. Buttons,
links and fields use a 3px focus outline with a 2px offset.

## Components

- **Buttons:** Use Radix Themes or the existing button classes. Primary actions use green; secondary
  actions use a surface and border. Keep disabled, hover and keyboard focus states visible.
- **Fields:** Text and date fields use a surface, border and 9px corners. Keep labels and useful
  hints adjacent to their controls. Use native controls where they already work well.
- **Navigation:** Links show a green-tinted active state. The mobile drawer closes on Escape and
  returns focus to its trigger.
- **Panels and badges:** Panels group related content with a border. Radix badges convey status;
  use text as well as color to communicate meaning.
- **Icons:** Use Lucide through the shared `Icon` component. Icons beside text are decorative;
  give icon-only controls an accessible name.
- **Emergency guidance:** Keep the warning readable and immediate, with a clear emergency action.

## Do's and Don'ts

- Do maintain light and dark palettes together and check contrast in both.
- Do use plain, specific language and explain requirements where they affect the next step.
- Do keep the illustration entrance brief and honor `prefers-reduced-motion`.
- Don't delay or animate emergency instructions.
- Don't add repeated summaries, promotional claims or decorative cards that add no information.
