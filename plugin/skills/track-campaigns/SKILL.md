---
name: track-campaigns
description: Check where a brand's Vereel campaigns stand, read what is still missing or what a reviewer returned, and change a campaign that is still in review. Use when a brand asks about the status of their campaigns or wants to fix or edit one.
---

# Where the brand's campaigns stand

`vereel_list_my_offers` lists the campaigns this brand has sent through the API or a
connected assistant, newest first, each with its status:

| Status | What it means for the brand |
|---|---|
| `in_review` | Written, not public. Waiting for the brand to publish it. Still editable from here. |
| `active` | Public on Vereel. Creators can apply. Not editable from here. |
| `rejected` | Returned with a note. Read the note out. |
| `closed` | No longer taking applications. |

`vereel_get_my_offer` gives one campaign in full: every field, its photos, what is still
missing before it can be published, and the reviewer's note if it was returned.

A campaign sitting at `in_review` is often waiting for the brand, not for Vereel. Check
what the answer says is missing before telling anyone to wait.

## Changing a campaign

`vereel_update_offer` changes a campaign **only while it is in review**. A campaign that
is already public or rejected cannot be changed from here; the brand edits a public
campaign at vereel.com. Only the fields you pass change.

Photos work differently from the other fields:

- **To add one**, use `vereel_add_offer_image` with an `https` link to a JPEG, PNG or
  WebP of at most 5 MB. Six photos per campaign, and the first is the cover.
- **To reorder or remove**, pass `photos` to `vereel_update_offer` with the campaign's
  current photo URLs in the order you want. **A URL you leave out is removed.** Read the
  campaign first and show the brand what the new order will be, because this is how a
  photo gets deleted by accident.

Changing the text of a campaign replaces what was there. Show the brand the new wording
and get their go-ahead before you send it.

## Publishing is theirs

No tool here publishes a campaign. When a brand asks why their campaign is not visible,
and the answer shows nothing missing, point them at **Campaigns** on vereel.com, where
they preview it and accept the Cooperation Terms to publish. Do not say Vereel is still
reviewing it when the campaign is actually waiting for them.
