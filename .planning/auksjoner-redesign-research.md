### 1. What currently feels dated or AI-generated (be specific)
The current page is functional, but several choices read as inherited dashboard
defaults rather than an intentional marketplace UI.

- `views/partials/sidebar.ejs:63-64,97-98` plus
  `public/css/landing.css:1302-1305,1382-1387`: the logo border and two
  divider rules split the rail into boxed zones. That is stock admin-template
  scaffolding, not a calm marketplace sidebar.
- `public/css/landing.css:1340-1365` plus
  `public/js/main.js:208-215`: `.app-sidebar-link.nav-active` relies on a
  `3px` left accent rail, asymmetric right-only rounding, and a weight bump.
  That is the default dashboard active state pattern the user already notices.
- `views/partials/sidebar.ejs:17-20`: the crossed gavel icon for
  **Auksjoner** reads like a struck-through hammer at `17px`, which weakens
  recognition of the primary route.
- `views/partials/sidebar.ejs:98-103`: the logged-in user area is entirely
  inline-styled, so the account state feels bolted on instead of designed as
  part of the same system as the rest of the sidebar.
- `views/auctions.ejs:7-57` plus `public/css/landing.css:1430-1558`: intro,
  stats, filter, and listing area are four consecutive full-width bands with
  alternating backgrounds and borders. That is textbook SaaS striping and
  delays the actual inventory.
- `public/css/landing.css:1445-1455` plus `1616-1631` and `1666-1674`: the
  eyebrow pill, status badge, and crop tags all reuse the same filled green
  chip language, so too many elements ask to be treated like labels of equal
  importance.
- `views/auctions.ejs:21-54` plus `public/css/landing.css:1475-1535`: four
  centered KPIs and an uppercase `Filtrer:` label give meta information more
  prominence than the farms, which is backward for a browse-first marketplace.
- `public/css/landing.css:1586-1590`: the card hover uses
  `translateY(-2px)`, a deeper shadow, and a greener border. That is the
  default generated hover recipe and too animated for this brand.
- `views/auctions.ejs:111-131` plus `public/css/landing.css:1677-1707`: the
  card footer is structured like a mini analytics strip with uppercase labels
  and green values, so each listing feels more like a widget than an auction.
- `public/css/landing.css:2525-2555`: mobile keeps most of the same
  intro-stats-filter stacking logic, so the generic dashboard rhythm survives
  on smaller screens instead of simplifying into a marketplace flow.

### 2. What must be preserved
The redesign needs to stay inside the current route, layout, and behavior
contracts.

- [ ] Keep the route data contract intact:
      `totalAuctions`, `avgDekar`, `avgBidPerDekar`, `allFylker`,
      `selectedFylke`, and `farms` must all still render.
- [ ] Keep `#fylke-filter` intact so `main.js:initFilters()` still reloads the
      page with `?fylke=`.
- [ ] Keep `.nav-active` as the sidebar active class because
      `highlightNav()` adds it to `.app-sidebar-link`.
- [ ] Preserve `body.has-sidebar`, the fixed sidebar, and
      `.app-page { margin-left: var(--sidebar-w); }` on desktop.
- [ ] Keep `.ap-farm-card-map`, `data-lat`, `data-lng`, and `data-polygon`
      unchanged so `initCardMaps()` still works.
- [ ] Stay inside the existing variable system:
      `--sidebar-w`, `--green`, `--green-pale`, `--green-light`,
      `--jl-surface-*`, `--border`, `--text-*`, `--radius*`, and
      `--shadow*`.
- [ ] Keep Manrope, the restrained palette, the calm surface language, and the
      current `0.5rem` to `1rem` radius family.
- [ ] Keep Norwegian UI copy throughout.
- [ ] Do not introduce gradients, glassmorphism, neon accents, or trend-first
      effects.
- [ ] Leave the existing mobile off-canvas sidebar behavior alone.

### 3. What modern, tasteful, non-AI marketplace and side-navigation UI looks like in 2025-2026
The strongest current references are quieter and more editorial than the
current page. They remove decorative chrome, start the real content earlier,
and keep state changes subtle.

- [Linear](https://linear.app/docs): borrow the soft enclosed active row
  pattern instead of a left accent rail. The selected item should feel
  contained, not highlighted by an external marker.
- [Notion](https://www.notion.com/help/navigate-with-the-sidebar): borrow
  grouping by headings and collapsible sections. `Favorites`, `Shared`,
  `Private`, and bottom utilities show that nav can be structured with
  whitespace and labels instead of heavy dividers.
- [Attio](https://attio.com/help/reference/productivity-collaborating/navigating-your-workspace):
  borrow the idea that a sidebar is curated, not exhaustive. Favorites,
  folders, and capped list exposure keep the rail focused on the routes people
  reuse.
- [Vercel dashboard](https://vercel.com/docs/dashboard-features/overview):
  borrow the inline list-header control pattern. Filter, sort, and view options
  belong directly on the resource list, not in a separate full-width band.
- [Stripe dashboard](https://docs.stripe.com/dashboard/basics): borrow the
  hierarchy where analytics live on overview surfaces and task pages lead with
  the thing you came to manage. The auctions index should lead with auctions.
- [FINN.no](https://www.finn.no/realestate/browse.html): borrow the
  inventory-first composition. You reach real listings quickly, and supporting
  context does not block the browsing flow.
- [Tise](https://support.tise.com/en/articles/13311006-how-do-i-find-products-on-tise):
  borrow the discovery mindset behind filtering by location and item type.
  Filters read as search refinements tied to the inventory, not as a separate
  form section.

### 4. Seven concrete design principles for this redesign
These should function as direct build rules, not as loose inspiration.

1. Replace the left-border active state with a soft enclosed row in
   `--jl-surface-container-low`; keep the text and icon in `--green`, and drop
   the accent rail and dramatic weight jump.
2. Remove permanent divider lines from the sidebar; separate groups with
   spacing and one muted group label at most.
3. Drop the eyebrow chip and treat the page intro as a compact heading block
   with one supporting sentence and the existing primary action.
4. Collapse stats and filter controls into the content column above the cards;
   the list header should carry count, filter, and secondary summary together.
5. Let status be the only state marker with visual emphasis; crop types must
   stop behaving like equal-priority pills.
6. Keep card interaction calm by changing border and shadow only; do not lift
   the card on hover.
7. Make the page feel like one continuous marketplace surface, using spacing
   and density for hierarchy instead of alternating full-width bands.

### 5. Sidebar-specific direction (detailed)
The sidebar should feel like a quiet navigation rail, not like a dashboard
template.

- **Logo area:** keep the wordmark and drop the tagline in the sidebar.
  `Jordleie.no` is enough at this scale, and losing the second line lets the
  nav start faster and removes the need for a hard visual break.
- **Icon set:** use one Lucide family at `16px` with `1.75` stroke. Swap to
  `LandPlot` for **Auksjoner**, `Info` for **Om**, `BookOpen` for
  **Hvordan kjøpe & selge**, `Newspaper` for **Artikler**,
  `MessagesSquare` for **Kontakt oss**, and `CircleUserRound` for
  **Min bruker**. If the conditional routes stay, use `LogIn` for
  **Logg inn** and `ShieldCheck` for **Admin**.
- **Section grouping:** label the two groups `Markedsplass` and `Konto` in a
  small muted sentence-case style. Use top margin between groups instead of
  another divider line.
- **Active state:** keep `.nav-active`, but restyle it as a full row shape with
  `background: var(--jl-surface-container-low)`, `color: var(--green)`,
  `border: 1px solid var(--border)`, `border-radius: var(--radius)`, and equal
  left and right insets. Remove the left border entirely and keep font weight
  close to the default.
- **Account footer:** move it into the CSS system and make it one quiet block
  at the bottom of the rail. Recommended structure:
  `Konto` label, compact identity row with circular initial, full name, email,
  then one full-width secondary `Logg ut` button. Keep **Min bruker** in the
  nav instead of repeating it here.
- **Collapsed-mobile behavior:** do not redesign it. The current off-canvas
  mechanics are already correct for mobile; only the visual treatment needs to
  change.

### 6. Page-specific direction (detailed)
The page should read like a place to browse farmland auctions, not like a
landing-page hero glued to a dashboard.

- **Intro:** drop the eyebrow pill. Keep `Jordleieauksjoner`, one short
  supporting sentence, and the existing CTA on the same row without turning the
  page into a hero.
- **Stats:** fold them into one subdued typographic summary in the list header,
  not a separate section. Example structure:
  `24 auksjoner · 142 daa i snitt · 670 kr/daa i snitt · 7 fylker`.
- **Filter:** place `#fylke-filter` inline with the result count and summary in
  the list header. It should feel like a result control, not like its own band.
- **Cards:** keep the desktop list format with the map on the right. Restyle
  status as a restrained dot-label or plain label instead of a filled capsule,
  switch crop types from filled pills to muted inline text, and keep the footer
  numbers in one calm row with sentence-case labels and less green emphasis.
- **Full-width bands:** keep at most a slim page intro separator. Collapse the
  stats and filter into the content column above the cards so the list begins
  much earlier and the page reads as one continuous surface.

### 7. Anti-patterns to avoid (explicit list)
The redesign can still go wrong even if it looks newer, so these failure modes
should be treated as hard no-go zones.

- Do not replace the current left accent rail with another accent stripe,
  underline, or tab notch.
- Do not keep separate full-width stats and filter bands above the listings.
- Do not add more pills, chips, or uppercase eyebrow labels to solve hierarchy.
- Do not use gradients, glass, blur, glossy cards, or larger hover lifts.
- Do not turn the card footer into three mini KPI widgets again.
- Do not make crop types, status, and metadata all compete with the same green
  emphasis.
- Do not switch the page into a masonry, carousel, or dashboard-grid layout;
  this page needs scanable list density.
- Do not break `.nav-active`, `#fylke-filter`, `.ap-farm-card-map`,
  `body.has-sidebar`, or the desktop `margin-left: var(--sidebar-w)` layout.
