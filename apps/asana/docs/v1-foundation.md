# Asana App V1 Foundation

## Why this first slice

The product intent is not just to expose generic Asana actions. The app needs a durable
entry-to-task connection so Contentful users can create, inspect, and later synchronize work
without rebuilding context every time.

The smallest useful customer-facing slice is:

1. Create one primary Asana task from a Contentful entry.
2. Persist that task link back to Contentful-owned integration state.
3. Render the linked task summary in the entry sidebar.
4. Reuse that link for follow-up status sync, comments, and updates.

## First link model

Start with one primary task link per entry:

- `entryId`
- `taskGid`
- `taskUrl`
- `taskName`
- `status`
- `assigneeName`
- `dueDate`
- `lastSyncedAt`

This keeps the initial model simple while still supporting the most important workflows from the
product brief.

## Near-term implementation order

1. Add the entry sidebar location and foundation UI.
2. Decide where the primary task link is stored.
3. Create the task from the sidebar and persist the link.
4. Read the linked task on load and show status, assignee, and due date.
5. Extend from there into status sync and template-driven task creation.

## Decision to defer

The temporary `Entry.publish` app event handler is still present for validation. It should not
become the long-term product shape for customer workflows and should be removed once the
automation-first path and durable linking model are in place.
