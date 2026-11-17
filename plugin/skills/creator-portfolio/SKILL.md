---
name: creator-portfolio
description: Read a creator's Vereel portfolio and rewrite the draft of its three texts - the headline, the about text and the niches. Use when a signed-in creator wants help with their Vereel portfolio wording. It changes the draft only and never publishes.
---

# A creator's Vereel portfolio

A Vereel portfolio is the page a creator shows brands. `vereel_get_my_portfolio` returns
the signed-in creator's portfolio: the **draft** and the **published** copy of its three
texts, its address (slug), whether it is published, and when Vereel last read the
creator's platform figures.

Three texts can be changed from here, with `vereel_update_my_portfolio`:

| Field | Limit | What it is |
|---|---|---|
| `headline` | 200 characters | The one line under the creator's name |
| `about` | 5000 characters | Who they are and what they make |
| `niches` | 500 characters | What they cover, as brands would search for it |

Only the fields you pass change. Any other property is refused by name.

## Two limits that matter

**This changes the draft, never the published page.** The published page stays exactly
as it was until the creator publishes the draft themselves at vereel.com. No tool here
publishes. Say so, rather than leaving them to think the change is already live.

**Figures are not yours to write.** Follower counts, engagement and the rest are read by
Vereel from the creator's connected platforms. They cannot be set from here, and a
portfolio that claims a figure its platforms do not support is worse than one that says
nothing. If a creator asks to put a number in, say where it comes from instead.

## Writing the texts

Replacing a text throws the old one away, so **show the creator the new wording and wait
for their go-ahead** before calling. Offer it as a draft they can change, not as a
finished decision.

Write from what the creator actually tells you and from what their portfolio already
holds. Do not invent brands they have worked with, campaigns they have run, or an
audience they have not mentioned: a brand reads this page to decide whether to pay them,
and an invented claim is the creator's problem, not yours.

If the creator has not said enough to write a good `about`, ask the two or three
questions that would make it specific — what they make, who watches, and what a brand
gets — rather than filling the space with adjectives.
