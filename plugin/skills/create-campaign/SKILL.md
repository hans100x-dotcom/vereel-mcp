---
name: create-campaign
description: Turn a plain-language brief into a complete Vereel influencer-marketing campaign and send it to the brand's Vereel account for them to publish. Use when a brand wants to add, create, or launch a campaign, offer, or collaboration on Vereel.
---

# Add a campaign to Vereel

A campaign written here arrives in the brand's Vereel account **in review**. The brand
publishes it themselves at vereel.com. Say that when you hand the result back, so nobody
waits for something to appear publicly that is actually waiting for them.

## Before you call anything

**Get the categories first.** Call `vereel_list_categories` and choose from what it
returns. Up to three category ids go on a campaign. A campaign filed under no category,
or a made-up id, is refused — and a campaign in the wrong category is not found by the
creators who would have applied.

**Ask for what is missing rather than inventing it.** A brief usually names the product
and the platform and leaves the rest open. Money, the follower minimum and what the
creator actually produces change who applies, so they are worth one short question
instead of a guess.

**Show the campaign and wait for a yes.** Write out the fields you are about to send, in
plain words, and ask the brand to confirm. The campaign carries their name in public
once they publish it, so they decide what it says.

## What a campaign must have

`vereel_create_offer` refuses a campaign without all of these:

| Field | What it is |
|---|---|
| `name` | The campaign name creators see |
| `description` | What the campaign is about and what the creator does |
| `offerType` | `PRODUCT`, `SERVICE` or `EVENT` |
| `platforms` | One or more of `instagram`, `tiktok`, `youtube`, `x` |
| `categoryIds` | One to three ids from `vereel_list_categories` |
| `isPayment` | Whether the creator is paid money |
| `isBarter` | Whether the creator receives a product or service |

A campaign can be paid, barter, or both. When anything is included for the creator — a
product, a service, or tickets — `includedDescription` says what they receive, and
Vereel requires it.

## What is worth filling in anyway

A campaign with only the required fields is thin, and creators pass over it. These cost
one question each:

- `deliverables` — how many `reels`, `posts`, `carousels` and `stories` the creator
  publishes. This is the single thing creators look at first.
- `additionalPayment` and `productServiceValue` with `currency` (`PLN` or `EUR`, the
  brand's own by default) — what the creator gets, in money and in goods.
- `followerMinimum` — one of 1000, 2000, 5000, 10000, 25000, 50000, 100000.
- `applyByDays` — how many days creators may apply after it goes live, 1 to 365, 21 by
  default.
- `imageUrls` — up to six `https` links to JPEG, PNG or WebP images of at most 5 MB
  each, which Vereel downloads. The first is the cover. **Attach at least one.** A
  campaign with no photo draws far less interest, and photos can only be added while the
  campaign is still in review.
- `publicationDuration` — `DAYS_30` (the default), `DAYS_60`, `DAYS_90` or `PERMANENT`.
- `expectedAudience` and `audience` — who the creator's followers should be, by gender,
  adult age group and city.
- `remarks` — anything else creators should know.

For an `EVENT`, also set `eventPlace`, `eventDateTime` (ISO 8601 with an offset) and
`ticketsIncluded`. When something must be shipped or arranged first, set
`requiresGoodsShipping` or `requiresPhysicalPresence` with its address and dates.

## After it is created

The answer carries the campaign's id and what is still missing. Tell the brand:

1. The campaign is in their Vereel account and is **not public yet**.
2. They publish it at vereel.com under **Campaigns**, where they see a preview of it as
   creators will see it and accept the Cooperation Terms.
3. Anything still missing, named in plain words, and that you can fix it from here with
   `vereel_update_offer` while the campaign is still in review.

If a photo failed to attach, say which one and why. Do not report a campaign as complete
when the answer says a field is still missing.

## When Vereel refuses

A refusal names the field. Read it back in plain words, fix the field, and try once more.
A refusal about a category almost always means an id that did not come from
`vereel_list_categories`. A refusal about `includedDescription` means something is
included for the creator but nothing says what it is.
