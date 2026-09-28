# ADR-0006: What this release must not change for installs that already exist

**Date:** 2026-09-28
**Status:** Accepted

## Context

The Mux app is a single hosted bundle behind one app definition. There is no per-install version
and no upgrade decision for the customer: when Contentful activates a bundle, **every** install is
on it at once. So this release reaches every org using the app on the same day, including the many
that will never enable Robots.

That makes "does the feature work" the easy half. The hard half is that a feature nobody asked for
must be invisible and inert for them. Five hazards stand against that:

1. **A publish that stores `pendingActions: null`** where the key used to be absent. The stored
   value would differ from what is on disk, so the browser's normalized diff would see a change and
   write the field again on every such publish; and the next publish's pending-action scan tests
   `'pendingActions' in value`, which is true for `null`, then indexes into it — throwing from
   outside the handler's try block and failing the whole event.
2. **A pending-action scan widened to every locale.** Correct in the abstract, but it would make
   the next publish execute actions queued in a non-default locale that have never run — including
   asset deletes queued long ago and forgotten.
3. **A configuration screen that lists Robots directives on mount.** Every existing customer
   opening app config would fire a cross-origin call to `api.mux.com/robots/v0/directives` and, on
   the 403 most of them would get, see an error notice on a screen they came to for something
   else.
4. **The Robots panel renders inside the field extension, on every entry with a video.** It is
   force-mounted: `Tabs.Panel` forwards `forceMount` to Radix, which otherwise unmounts an inactive
   panel, and the panel's poll loop has to keep running while the editor watches another tab. So it
   is mounted for installs that never enable Robots too, and an unhandled render error there would
   unmount the whole field editor: no player, no captions, no upload area.
5. **A Robots read writes.** The tab records every job it reads for the entry's asset, whoever
   started it (ADR-0005). An entry whose asset has any job gains `robotsJobs` and field version 4 on
   the first read of the tab, or on ADR-0013's resumed poll, and a published entry shows *Changed*.
   On an install that uses Robots that is the feature; on one that does not, it must never happen.

Two more forces shape the tab itself. The strip it sits in holds eight tabs, about 860 px, in an
entry editor field column that is routinely half that. And during a deploy, tabs on the previous
bundle and the new one can edit the same entry.

## Decision

1. The merge deletes `pendingActions` rather than nulling it, and the scan is hardened against the
   `null` the function's own first cycle writes (ADR-0002).
2. The scan stays first-locale-only. The multi-locale bug is documented, not fixed here.
3. Directives are listed only when someone clicks. Nothing is requested on mount.
4. The Robots panel is wrapped in `RobotsErrorBoundary`, so a fault there costs exactly that tab.
   With the panel force-mounted the boundary is load-bearing. Mounting costs no requests: `isActive`
   gates the first load, and only an entry that already holds an unfinished job or a fresh
   placeholder resumes reading on its own (ADR-0013).
5. Robots reads write nothing on installs without Robots: their job list is refused, so there are
   no jobs to record, and a tab nobody opens reads nothing.

Two properties already designed for, restated because they are the ones a regression would be
worst in:

- **The field version is derived, never asserted** (`deriveFieldVersion`). An entry with no Robots
  data produces a byte-identical value, so no `setValue` happens and no published entry flips to
  *Changed*. Pinned by tests that fail if the version is hard-coded.
- **The request body sent to Mux is unchanged when no directives are configured.**
  `buildAssetSettings` adds the `directives` key only when there is something to put in it.

**Capability is decided by the job list read, and nothing else.** `capabilityFromError` is the one
classifier; the config screen adapts its raw `fetch` response with `muxApiErrorFromResponse` and
asks the same function, so both show the same notes. The status decides, not the type, because Mux
gives every 403 of this kind the type `forbidden`: a 401 (or an `insufficient_scope` type, which
nothing Mux documents sends) is `scope-missing`; a `forbidden` 403 is `not-enabled`, the one 403
the API reference documents on the Robots endpoints, meaning the Robots terms have not been
accepted. Mux's message is read only for the dashboard page it names, which becomes the note's
`termsUrl` if it is on `https://dashboard.mux.com/`, and the dashboard root otherwise.

The capability states are `enabled`, `not-enabled` and `scope-missing`. The list read caches its
answer for the browser session, the panel reads that cache at mount and does not fetch when it
says unavailable, and an unavailable answer replaces the tab, because nothing in it could work. An
account does not acquire the `robots:*` scope between two entries.

A refused create is a failed run, never a capability answer: Mux's scopes separate reading Robots
from writing it, and a workflow such as `translate-audio` is refused on the free plan while every
other one runs. Its toast carries Mux's reason. A refusal that could mean the account lost access —
a 401, or a `forbidden` 403 — asks the list again, and the list decides. Running out of units is
an **advisory**, `units-exhausted`: a warning over a working tab, never cached, cleared by the next
run Mux accepts, because that is the only evidence units are back. A remount starts without it.
Any other `robots_*` 403 changes nothing beyond the run.

**The first paint waits for one round trip.** Every Mux read from the field location goes through
`muxProxy`, so the job list's app-action round trip is the floor. Once the session knows Robots is
on, an opened tab draws its buttons, the Directives heading and the picker at once, with loading
rows where the jobs will go. An unopened tab, or one whose account is not yet known, draws only a
placeholder: for most installs the answer is that Robots is off. The directive listing runs
alongside the job list when Robots is known to be on or directives are configured, which an install
without Robots never has. Units reads *Loading…* on a row the background detail pass will reach,
and *Not loaded* only past that window (ADR-0005). The asset resync the list sets off for completed
jobs runs beside the list rather than inside it, so its failure cannot be classified as the
account losing Robots.

**The tab strip scrolls, and the scrollbar is the affordance.** `.tabs-scroll` is
`overflow-x: auto` with tabs at `flex: 0 0 auto`, and focusing a tab brings it into view, so every
tab is reachable by scroll and by keyboard. The scrollbar is thin and always drawn rather than left
to the platform's overlay behaviour, and appears exactly when there is overflow. There is no fade
mask: a gradient over the end of the strip fades whichever tab sits on the boundary mid-word, at
every width, and paints over the scrollbar.

**A deploy leaves placeholders alone.** A tab still on the previous bundle ignores
`robotsPendingCreates` — it shows no pending row and does not block Run on it — and preserves it,
because every mutator spreads the stored value. A rollback leaves any leftover placeholders on
entries, preserved and ignored in the same way.

## Consequences

### Positive
- An install that never enables Robots sees one extra tab and nothing else: no writes, no entry
  churn, no exposure to faults in code it does not use, and opening the tab costs one failed
  request per session rather than one per entry.
- The config screen and the tab cannot disagree about a refusal, and neither tells an editor to
  replace a working token on a guess. A workflow the plan lacks costs a toast, and running out of
  units a warning; the tab, its history and the poll keep going.
- The table, the Run button and the picker arrive together at the first round trip, and a resync
  that fails cannot turn a working tab into a capability note.
- Every tab is legible at the widths this editor renders at.

### Negative
- The per-locale pending-action bug survives, and someone will hit it again.
- The error boundary can mask a real bug behind a friendly notice. It logs to the console, which is
  the trade accepted.
- On an install that uses Robots, the first read on an entry whose asset has any job — started from
  another entry, a directive or the Mux dashboard — marks a published entry *Changed*, whatever the
  editor's workflow.
- A token that can read Robots but not write it sees every run refused with Mux's reason in a toast
  rather than the scope explainer. The config screen answers every 401 with the scope note, so a
  mistyped secret gets an explainer whose remedy, a new token, also fixes the typo. The terms link
  depends on Mux keeping the URL in its message; without it the link degrades to the dashboard
  root.
- An unknown account shows a placeholder for the first round trip rather than the tab's structure.
  With directives configured, the listing goes out before the job list has said whether Robots is
  on: on an account that has lost Robots, that is a second failed request in the session.
- During a deploy, a runner on the previous bundle is not blocked by a placeholder, so a second
  create is bounded only by Mux's 409 for an identical job already pending or processing, or a run
of the directive already in progress.

### Neutral
- The new tab shifts the tab order for everyone.
- The session capability cache is never invalidated on a credential change, which is a deliberate
  trade.
- The test that pins the absence of the fade mask is a regression guard, not a layout test: jsdom
  has no layout, and the scrolling is checked by hand in a browser at a constrained width.
