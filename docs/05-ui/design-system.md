# OnlineDoc Design System

## Purpose

The OnlineDoc Design System defines the visual language and interface standards used throughout the OnlineDoc platform.

It provides a consistent foundation for designing and developing user interfaces while ensuring a unified experience across the application.

This document serves as the single source of truth for the OnlineDoc user interface.

---

# Design Philosophy

Healthcare is already stressful.

The interface should reduce cognitive load, build trust, and help users complete tasks confidently.

Every interface should be:

- Simple
- Clean
- Professional
- Calm
- Trustworthy
- Accessible

Design decisions should prioritize clarity over decoration.

---

# Design Principles

Every screen should answer three questions immediately.

- Where am I?
- What can I do here?
- What should I do next?

Guiding principles

- One primary action per screen.
- Use generous white space.
- Keep layouts predictable.
- Minimize visual noise.
- Prefer clarity over creativity.
- Reduce unnecessary typing.
- Always provide clear feedback.

---

# Design Tokens

Design tokens are the foundation of the visual system.

Every visual value should be represented as a reusable token.

## Color Tokens

```css
--color-primary
--color-primary-hover
--color-brand
--color-brand-hover
--color-accent

--color-background
--color-surface
--color-border

--color-text-primary
--color-text-secondary

--color-success
--color-warning
--color-error
--color-info
```

## Typography Tokens

```css
--font-family
--font-size-h1
--font-size-h2
--font-size-h3
--font-size-body
--font-size-small

--font-weight-regular
--font-weight-medium
--font-weight-semibold
--font-weight-bold
```

## Spacing Tokens

```css
--space-xs
--space-sm
--space-md
--space-lg
--space-xl
--space-2xl
--space-3xl
```

## Radius Tokens

```css
--radius-sm
--radius-md
--radius-lg
--radius-xl
--radius-full
```

## Shadow Tokens

```css
--shadow-sm
--shadow-md
--shadow-lg
--shadow-xl
```

These variables become the single source of truth for styling throughout the platform.

---

# Color System

## Primary Palette

| Token | Value | Usage |
|--------|--------|-------------------------------|
| Primary | #0F2A43 | Headers, navigation, titles |
| Primary Hover | #133453 | Hover states |
| Brand | #2CB1BC | Primary buttons, links |
| Brand Hover | #13919B | Hover states |
| Accent | #E33935 | Errors and urgent indicators |

---

## Neutral Palette

| Token | Value | Usage |
|--------|--------|-------------------------------|
| Background | #F8FAFC | Application background |
| Surface | #FFFFFF | Cards and dialogs |
| Border | #E2E8F0 | Borders |
| Text Primary | #111827 | Primary text |
| Text Secondary | #64748B | Secondary text |
| Info Background | #E0FCFF | Information panels |

---

## Semantic Colors

### Success

Used for

- Successful payments
- Completed consultations
- Success alerts

### Warning

Used for

- Pending actions
- Follow-up reminders

### Error

Used for

- Validation
- Failed operations
- Destructive actions

### Information

Used for

- Guidance
- Status information
- Educational content

---

# Typography

## Font Family

Primary

Geist Sans

Fallback

- system-ui
- Segoe UI
- Roboto
- Helvetica Neue
- Arial
- sans-serif

---

## Typography Principles

- Readability first.
- Maintain clear hierarchy.
- Use sentence case.
- Avoid decorative typography.
- Never rely on color alone to communicate meaning.

---

## Type Scale

| Style | Size | Line Height | Usage |
|--------|------|-------------|----------------|
| H1 | 32px | 44px | Page title |
| H2 | 24px | 34px | Section title |
| H3 | 20px | 28px | Card title |
| H4 | 18px | 26px | Subsection |
| Body Large | 16px | 26px | Important content |
| Body | 14px | 22px | Default text |
| Small | 12px | 18px | Captions |

---

## Font Weights

| Weight | Usage |
|----------|----------------|
| 400 | Body |
| 500 | Navigation |
| 600 | Subheadings |
| 700 | Main headings |

---

# Responsive Design

## Breakpoints

| Device | Width |
|----------|--------|
| Mobile | <640px |
| Small Tablet | 640px |
| Tablet | 768px |
| Laptop | 1024px |
| Desktop | 1280px |
| Wide Desktop | 1536px |

Rules

- Mobile-first development.
- Avoid horizontal scrolling.
- Navigation adapts automatically.
- Cards stack vertically.
- Tables become scrollable when required.

---

# Layout System

## Maximum Widths

Marketing Pages

1280px

Content

760px

Dashboard

100%

Sidebar

280px

---

## Page Padding

Mobile

16px

Desktop

32px

---

# Grid System

Marketing

12-column responsive grid.

Dashboard

Responsive CSS Grid.

Cards

24px gap.

---

# Spacing System

OnlineDoc follows an 8-point spacing system.

| Token | Value |
|--------|--------|
| XS | 4px |
| SM | 8px |
| MD | 16px |
| LG | 24px |
| XL | 32px |
| 2XL | 48px |
| 3XL | 64px |

---

# Border Radius

| Component | Radius |
|------------|---------|
| Button | 10px |
| Input | 10px |
| Card | 16px |
| Dialog | 20px |
| Badge | Full |

---

# Elevation

| Level | Usage |
|---------|----------------|
| 1 | Cards |
| 2 | Dropdowns |
| 3 | Dialogs |
| 4 | Floating elements |

Prefer white space before shadows.

---

# Icons

Library

Lucide Icons

Rules

- Outline style.
- Consistent stroke width.
- Icons support labels.
- Avoid icon-only controls where clarity matters.

Sizes

- 16px
- 20px
- 24px
- 32px

---

# Component Standards

Every component documents

- Purpose
- Props
- Variants
- Sizes
- States
- Accessibility
- Examples

---

# Component Anatomy

Every reusable component should define

- Header
- Body
- Footer
- Actions
- Optional elements
- Empty state

---

# Buttons

Variants

- Primary
- Secondary
- Outline
- Ghost
- Destructive

Sizes

- Small
- Medium
- Large

States

- Default
- Hover
- Focus
- Active
- Disabled
- Loading

Rules

- One primary button per section.
- Buttons always include visible labels.
- Minimum height 44px.

---

# Forms

Rules

- One label per field.
- Labels always visible.
- Helper text below field.
- Validation below helper text.
- Required fields clearly marked.
- Use autocomplete whenever possible.

---

# Interaction States

Every interactive component supports

- Default
- Hover
- Focus
- Active
- Disabled
- Loading
- Error

Interaction behaviour remains consistent across the platform.

---

# Cards

Every card contains

- Title
- Supporting information
- Primary action
- Optional secondary action

Padding

24px

Radius

16px

---

# Tables

Support

- Search
- Sorting
- Pagination
- Responsive scrolling

Avoid wrapping identifiers.

---

# Navigation Standards

Navigation answers

- Where am I?
- Where can I go?
- How do I return?

Marketing

Top navigation.

Dashboard

Persistent sidebar.

Mobile

Responsive navigation.

---

# Modals

Maximum Width

640px

Must support

- ESC close
- Close button
- Outside click
- Focus trapping

---

# Feedback Patterns

## Loading

Prefer skeletons over spinners.

## Empty State

Contains

- Illustration
- Title
- Description
- Primary action

## Error State

Contains

- Human-readable explanation
- Recovery action

## Success State

Contains

- Confirmation
- Next step

---

# Notifications

## Toast

Short-lived.

Desktop

Bottom-right.

Mobile

Bottom.

---

## Alert

Persistent.

Requires acknowledgement.

---

## Banner

Global platform information.

---

# Motion

Duration

Fast

150ms

Normal

250ms

Slow

350ms

Rules

- Animate purposefully.
- Avoid decorative animation.
- Respect reduced-motion preferences.

---

# Accessibility

Minimum touch target

44×44px

Requirements

- WCAG AA contrast.
- Full keyboard navigation.
- Visible focus indicators.
- Semantic HTML.
- ARIA attributes where appropriate.

---

# Dashboard Patterns

## Metric Card

Contains

- Title
- Value
- Trend
- Icon

---

## Patient Card

Contains

- Avatar
- Patient Name
- Status
- Consultation Count
- Action

---

## Consultation Card

Contains

- Status Badge
- Patient
- Clinician
- Started
- Updated
- Action

---

# Healthcare Components

Reusable business components

- Patient Summary Card
- Consultation Timeline
- Vital Signs Card
- Medication Card
- Prescription Preview
- Laboratory Request Card
- Referral Card
- Payment Summary
- Digital Product Card
- Clinician Availability Card
- Consultation Queue Item
- Urgent Consultation Badge
- Medical Certificate Preview
- Clinical Note Viewer
- Health Education Card

These represent business concepts rather than generic UI.

---

# Design Do's

- Keep interfaces simple.
- Use generous white space.
- Maintain consistent terminology.
- Build reusable components.
- Prioritize readability.
- Show one primary action.
- Follow established spacing.

---

# Design Don'ts

- Multiple competing primary buttons.
- Crowded layouts.
- Hidden critical actions.
- Decorative complexity.
- Duplicate components.
- Inconsistent terminology.
- Excessive colors.

---

# Component Lifecycle

Every component progresses through

1. Purpose
2. Design
3. Implementation
4. Documentation
5. Accessibility Review
6. Testing
7. Production Approval

No reusable component is considered complete until all stages are satisfied.

---

# UI Decision Records (UDRs)

Significant UI decisions must be documented.

## Format

### UDR-001

Decision

Use chat bubbles instead of threaded comments.

Reason

Patients are already familiar with messaging interfaces.

Impact

Consultation messaging remains consistent across desktop and mobile.

---

### UDR-002

Decision

Use a persistent dashboard sidebar.

Reason

Healthcare workflows require rapid navigation between modules.

Impact

Patient and clinician dashboards share a consistent navigation pattern.

---

# Design Governance

The Design System is the authoritative source for all interface decisions.

Every new component must:

- Follow this document.
- Reuse existing patterns.
- Avoid introducing duplicate components.
- Meet accessibility requirements.
- Support responsive layouts.
- Be documented before implementation.

Changes to the Design System should be reviewed before adoption to preserve consistency across the OnlineDoc platform.