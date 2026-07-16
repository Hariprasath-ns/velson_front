---
name: frontend-data-analytics
description: Design and implement high-performance, beautiful, and deeply insightful data analytics dashboards, visualizations, and exploratory interfaces. Use this skill when the user asks to build charts, data tables, metrics dashboards, reporting tools, or any interface designed to present complex datasets to users. Generates production-grade, visually striking analytics UIs that go beyond cookie-cutter template designs.
license: Complete terms in LICENSE.txt
---

This skill guides the creation of distinctive, production-grade frontend data analytics interfaces that combine analytical rigor with exceptional visual design. It avoids generic "recharts-default" or bootstrap-style dashboards, opting instead for bespoke, high-performance visual storytelling.

The user provides data analytics requirements: a dashboard, chart component, data table, reporting view, or interactive analysis tool. They may include sample datasets or describe the target audience (executives, operational staff, data scientists).

## Analytics Design Thinking

Before coding, think like a senior data analytics designer and align on a clear presentation strategy:
- **Core Insight**: What is the primary question this interface answers? What is the "hero" metric or visual?
- **Data Density**: Choose the appropriate density. 
  - *Executive/Presentation*: Generous spacing, large KPI cards, clean high-level trends, high visual polish.
  - *Operational/Exploratory*: Compact layout, dense grids, multi-dimensional charts, direct access to raw data, advanced filtering.
- **Visual Integrity**: Ensure the visual design does not distort the data. Avoid vanity 3D charts, misleading axes, or color choices that lack semantic meaning.
- **User Flow**: Design for the "Information Seeking Mantra": *Overview first, zoom and filter, then details-on-demand.*

## Frontend Analytics Guidelines

Focus on:
- **Typography & Numbers**: Numbers are first-class design citizens. Use tabular/monospaced numbers (`font-variant-numeric: tabular-nums`) for alignment in tables and KPI cards. Choose highly legible sans-serif or geometric typefaces for chart labels and axes.
- **Color Systems for Data**: Commit to mathematically and perceptually sound color palettes:
  - *Categorical*: Distinct, easily distinguishable colors for unrelated categories.
  - *Sequential*: Monochromatic gradients representing ordered numerical values (e.g., density, volume).
  - *Diverging*: Dual-hue gradients highlighting deviations from a critical midpoint (e.g., positive vs. negative growth).
  - *Semantic*: Standardized indicator colors (success/warning/danger) used sparingly and consistently.
- **Bespoke Visual Detail**: Avoid generic aesthetics. Customize every aspect of the visualization:
  - *Tooltips*: Glassmorphic styles, micro-tables, comparison deltas, custom indicators, and smooth positioning.
  - *Grid Lines & Axes*: Subdued, ultra-thin borders (`1px solid rgba(..., 0.08)`), dashed patterns, or completely custom grid spacing.
  - *Chart Fills*: Soft gradients, area charts with semi-transparent fills, or subtle pattern overlays (dots/stripes) to add texture.
- **Interactivity & Micro-interactions**: Make data tactile.
  - *Brushing & Linking*: Hovering over a data point in one chart highlights the corresponding segment in another.
  - *Transitions*: Animate data updates smoothly (using CSS transitions or library interpolations) to help the user track changes without losing context.
  - *State Feedback*: Show skeleton loaders for charts, distinct empty states, and visual hints when filters are active.
- **Performance & Scalability**: Analytics UIs must feel fast even with large datasets:
  - Use virtualization (e.g., `react-window`) for long data tables.
  - Debounce slider, search, and filter inputs to avoid thrashing chart rendering.
  - Optimize canvas/SVG boundaries; use HTML Canvas or WebGL for rendering tens of thousands of data points.

## Visualizations & Chart-Specific Design

When designing and implementing specific chart types, apply these strict rules to maximize readability and visual excellence:

- **Line & Area Graphs (Trends over Time)**:
  - *Stroke & Curve*: Use a slightly smoothed curve (monotone X interpolation) rather than jagged sharp lines or over-smoothed loops. Keep stroke widths distinct (typically `2px` or `3px`).
  - *Area Fills*: For area charts, use a smooth vertical gradient that fades from the theme accent color (at the top) to fully transparent (at the bottom). Avoid solid fills that block background context.
  - *Points/Dots*: Hide individual data points by default and display them dynamically on hover with a micro-scale effect and an outer ring/shadow.
- **Bar & Column Charts (Comparisons)**:
  - *Sizing & Spacing*: Keep the gap between bars (bar gap/padding) between 20% and 40% of the bar width. Too wide feels empty; too narrow looks clustered.
  - *Rounded Corners*: Apply a subtle border-radius to the outer ends of the bars (e.g., `4px` or `6px` top-corners for vertical columns) to make them feel organic and modern.
  - *Grid Lines*: Only draw horizontal grid lines (for vertical bars) or vertical grid lines (for horizontal bars).
- **Pie & Donut Charts (Parts-to-Whole)**:
  - *Prefer Donut*: Always prefer a Donut chart over a solid Pie chart. The empty center creates breathing room and can be used to display the total sum or the active segment's label and value.
  - *Slice Limit*: Limit categories to a maximum of 5–6 slices. For datasets with more categories, group the smallest ones into an "Other" slice.
  - *Labels & Legends*: Avoid diagonal text labels pointing to slices. Instead, use clean, interactive legends paired with dynamic, on-hover center-label updates in donut charts.
  - *Spacing*: Add a small gap between slices (e.g., `innerRadius` with padding or `stroke` equal to the background color with a width of `2px` or `3px`) to define boundaries clearly.
- **Scatter & Bubble Plots (Relationships)**:
  - *Overlapping & Opacity*: Use transparent fills (`rgba`) or mix-blend-modes (like `multiply` or `screen`) so overlapping points are visible and represent data density naturally.
  - *Scale & Contrast*: Size bubbles proportionally to the square root of the value (area-based scaling) to avoid visual exaggeration.

NEVER use lazy defaults:
- Do not use default chart library themes (bright primary blue, green, red without adjustments).
- Do not neglect empty, loading, or error states for data components.
- Do not overflow chart labels or leave overlapping axis tick marks.
- Do not design static charts when the user expects to slice and dice the data.

**IMPORTANT**: A successful analytics interface balances aesthetic beauty with cognitive efficiency. The design should draw the user's eye to anomalies, trends, and key performance indicators instantly, without causing visual fatigue.
