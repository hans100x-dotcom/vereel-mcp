# Anthropic: Connectors Directory

Two submissions, both at [claude.ai/directory/manage](https://claude.ai/directory/manage)
under **Submit new**:

1. **MCP connector** — the hosted server at `https://www.vereel.com/api/mcp`. This is the
   listing people find when they look for Vereel, and it carries the authentication
   configuration and the usage dashboard.
2. **Plugin bundle** — the [`plugin/`](../plugin/) folder of this repository, which adds
   the skills on top of the same server.

Anthropic's documentation says to submit both when a plugin points at a server you run:
the connector listing is what gives the organization the server's details and lets the two
be paired. Submitting only the plugin leaves the server unlisted.

Anyone on a paid Claude plan can submit. Everything in the directory must comply with the
[Software Directory Terms](https://support.claude.com/en/articles/13145338-anthropic-software-directory-terms)
and the [Software Directory Policy](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy).

---

## 1. The MCP connector

### Pre-submission checklist

| Requirement | State |
|---|---|
| Remote and reachable over HTTPS | Done — `https://www.vereel.com/api/mcp` |
| Authentication works for Claude's client | Done — OAuth 2.0 with DCR and CIMD advertised |
| Every tool has a `title` and a `readOnlyHint` or `destructiveHint` | Done — all ten tools |
| Tested in Claude as a custom connector, every tool called | **Not done.** The first attempt, on 2026-11-13, failed before any Vereel page appeared; the cause was an unauthenticated probe answered with a bare `405`, which is fixed and live. The run has not been repeated since. |
| Listing materials | Prepared below |
| Account can submit | Needs a person on a paid plan |

The one open item is the test in Claude, and the portal's **Test & launch** step asks you
to confirm you have done it. Do that before submitting, not after.

### Reads and writes are separate tools

Anthropic rejects a tool that accepts both read-only and write-capable methods. Vereel's
do not: the three public tools and the three account read tools are annotated
`readOnlyHint: true`, and creating, changing and adding a photo are separate tools with
`readOnlyHint: false`.

| Tool | Annotation | Needs sign-in |
|---|---|---|
| `vereel_list_categories` | read-only | no |
| `vereel_search_offers` | read-only | no |
| `vereel_get_offer` | read-only | no |
| `vereel_list_my_offers` | read-only | yes |
| `vereel_get_my_offer` | read-only | yes |
| `vereel_get_my_portfolio` | read-only | yes |
| `vereel_create_offer` | write, not destructive | yes |
| `vereel_update_offer` | write, destructive | yes |
| `vereel_add_offer_image` | write, not destructive | yes |
| `vereel_update_my_portfolio` | write, destructive | yes |

### Step 3 — Listing

**Server name** (up to 100 characters)

```
Vereel
```

**One-liner** (up to 200 characters)

```
Add influencer-marketing campaigns to Vereel from a plain-language brief, and search the campaigns brands have already published. You review and publish every campaign yourself.
```

**Description** (up to 2,000 characters)

```
Vereel is an influencer-marketing marketplace. Brands publish campaigns, and creators on Instagram, TikTok, YouTube and X apply to them.

Describe a campaign in plain language and this connector writes it into your Vereel account: the name and description, how many Reels, posts, carousels or Stories the creator publishes, which platforms it runs on, the category, the compensation in money or goods, the follower minimum, how long creators may apply, and up to six photos. Categories come from Vereel's own list, so a campaign lands where the creators who would apply are looking.

Nothing goes public on its own. A campaign added here arrives in your account in review, and you publish it yourself at vereel.com, where you see a preview of the campaign as creators will see it and accept the Cooperation Terms for it. The connector cannot publish, delete, pay, or accept an application. While a campaign is still in review you can change its fields and photos from the conversation, and read Vereel's note if it was returned to you.

You can also search the campaigns that are already public without an account at all, by words, category, campaign type, platform and language. Payment amounts are not shown there, exactly as they are not shown to an anonymous visitor of the site.

Creators who sign in can read their Vereel portfolio and rewrite the draft of its three texts — the headline, the about text and the niches. Follower counts and the other figures on a portfolio are read by Vereel from the connected platforms and cannot be set here, and publishing the portfolio stays with the creator.

Signing in happens on vereel.com. You choose whether the connection may only read your campaigns or also create them; creating also asks you to accept the Cooperation Terms. Disconnect it at any time under Connected apps in your Vereel settings.
```

**Categories** (one to five, from the portal's own list) — **a person chooses.** The list
is not public. Marketing, sales, or productivity are the likely fits.

| Field | Value |
|---|---|
| Documentation URL | `https://www.vereel.com/en/api` |
| Privacy policy URL | `https://www.vereel.com/en/privacy` |
| Support contact | `https://www.vereel.com/en/contact` |
| Icon | [`../plugin/assets/icon.png`](../plugin/assets/icon.png) — 512×512 PNG, 25 KB |
| URL slug | `vereel` — **permanent once published** |

### Step 4 — Use cases

**Primary use cases.** A brand adds an influencer-marketing campaign to Vereel from a
brief and checks where its campaigns stand. Anyone searches the campaigns that are
already public.

**What users need before they can connect.** A Vereel account as a brand, for anything
touching their own campaigns; the free plan is enough. Searching public campaigns needs
nothing. A creator needs a Vereel creator account with a portfolio.

**Reads, writes, or both.** Both.

### Step 5 — Company

Company name, website `https://www.vereel.com`, and a primary contact for review
updates — **a person fills these in.** The legal entity name is not recorded in this
repository.

### Step 6 — Authentication

- **Authentication requirement:** *Required when the server asks.* The server starts
  without sign-in, because `vereel_list_categories`, `vereel_search_offers` and
  `vereel_get_offer` work for anyone; the rest answer `401` with a challenge.
- **Authentication methods:** OAuth 2.0.
- **Anthropic-held OAuth client:** not needed. The server advertises a
  `registration_endpoint` for Dynamic Client Registration and
  `client_id_metadata_document_supported: true`. Leave the client ID and secret empty
  rather than minting a long-lived secret to hand over.
- **Users connect to different URLs:** no. One URL for everyone, which also keeps the
  listing publishable without waiting for the Verified label.

### Step 7 — Data handling

- The underlying API is **our own**.
- **No** personal health data.
- **No** sponsored content.

### Step 8 — Test & launch

Confirms you ran every tool yourself. Do the custom-connector run first (see the
checklist above). **Do not put credentials in the portal** — Anthropic asks for test
access by email if the listing goes to Verified review.

### Step 9 — Compliance

Seven acknowledgements, all required: directory guidelines, first-party API usage,
financial transactions, AI media generation, prompt injection, conversation data
collection, public documentation. Two are worth reading against what Vereel does:

- **Financial transactions.** Vereel is a marketplace where brands pay creators, but no
  tool here moves money, and the connector cannot pay. The payment happens in Vereel,
  between the brand and the creator.
- **Prompt injection.** Campaign names, descriptions and portfolio texts are written by
  users. The server marks what it returns as untrusted, and the skills say to treat it as
  content rather than instructions.

### After submitting

Anthropic scans the submission and, by default, lists it as a **Community** connector.
Verification is Anthropic's to escalate; there is no application for it. Status and
reviewer feedback appear in the portal. Escalations go to `mcp-review@anthropic.com`.

---

## 2. The plugin bundle

### Source step — the field that decides everything

The plugin is **not** at the repository root. The root holds the npm package; the plugin is
the [`plugin/`](../plugin/) folder. The portal's **Plugin path** field is marked optional,
and leaving it empty means *the repository root*, which is not a plugin. That is what this
blocking finding means:

```
This folder is not a plugin. If the plugin is in a subfolder, set the plugin path
to that folder (for example plugins/my-plugin) and validate again. Otherwise add
.claude-plugin/plugin.json with at least {"name": "…"}.
```

Nothing in the repository is wrong when that appears. Checked on `main` on 2026-11-17:
`plugin/.claude-plugin/plugin.json` is there, 878 bytes, valid JSON, no BOM, `"name":
"vereel"`, and every path it names resolves — `assets/icon.png` and five `skills/<name>/SKILL.md`.

Fill the step in one of two ways:

| Field | Value |
|---|---|
| Repository | `hans100x-dotcom/vereel-mcp` |
| Plugin path | `plugin` — **required here, no leading or trailing slash** |
| Branch or tag | leave empty to follow `main` |

Or paste the folder's own URL into **Repository** and let the portal fill the other two
fields itself:

```
https://github.com/hans100x-dotcom/vereel-mcp/tree/main/plugin
```

A validation result applies to one commit: push to `main` after validating and you
validate again.

### Validation

`claude plugin validate ./plugin` passes on the structure, the skills and the paths. On
the version installed here it reports one error that is **the CLI's age, not the
manifest's**:

```
root: Unrecognized keys: "displayName", "icon", "documentationUrl",
      "supportUrl", "privacyPolicyUrl", "termsOfServiceUrl"
```

Anthropic's documentation says the directory reads `icon`, `documentationUrl`,
`supportUrl`, `privacyPolicyUrl` and `termsOfServiceUrl` from `plugin.json` for the
listing, and that `claude plugin validate` stops reporting them as unknown on Claude Code
v2.1.281 or later. The CLI here is 2.1.118. Removing those six keys makes the same command
print `✔ Validation passed`, which is how the rest of the manifest was checked. Keep the
keys: the portal's **Validate** is the check that counts, and it is what reads them.

That older CLI also does not check `.mcp.json`, which needs v2.1.281 or later, so the
remote server entry has not been validated locally, and it does not accept `--strict`,
which the documentation now asks for. The portal validates both, and runs more checks than
the command does.

### The findings, and what to do about each

The portal validated the `plugin` folder on 2026-11-17 and **passed with warnings**.
Nothing blocks the submission. Two findings:

**1. Name and publisher checks — passed with warnings.** The report offered to let us
change `name`, `displayName` or `author.name` so the name "no longer resembles the other
name", or leave it for the reviewer to decide.

**Leave it. Do not change the name.** `vereel` is the company's own product name; the
domain, the `author.url`, the `repository` and the hosted server all carry it. Anthropic's
checklist classes this family of findings — **Name matches a known brand**, **Name may be
confused with an existing listing**, **Publisher name may be confused with another** — as
*held for a reviewer*, which is explicitly not a rejection: a person reads the version
before it goes live. Changing the name to dodge the hold would trade a correct name for a
wrong one, and `name` is permanent once the plugin is published: every existing install is
recorded under it, so a later rename loses them.

What was done instead is to make the reviewer's decision quick: the plugin's `README.md`
now carries a **Who publishes this** section stating that Vereel runs vereel.com and the
hosted server, that the repository belongs to it, and that the plugin is not affiliated
with or a fork of any similarly named project. The README is what the reviewer reads, and
the directory shows it as the listing's description.

One thing to know before publishing: if the name ever does have to change, and the plugin
is live while the organization is not Verified, email `directory@anthropic.com` first
rather than pushing the change.

**2. Unrecognized manifest fields.** The report asked us to check each unexpected field's
spelling against the plugins reference, remove it, or keep it if the directory alone reads
it — and said of `icon` that the directory reads it and Claude Code ignores it, with no
action needed.

**No action.** Every key in `.claude-plugin/plugin.json` was checked against the manifest
reference's field table: `name`, `displayName`, `version`, `description`, `author`,
`homepage`, `repository`, `license`, `keywords` are recognized fields, and `icon`,
`documentationUrl`, `supportUrl`, `privacyPolicyUrl` and `termsOfServiceUrl` are the five
**directory listing fields** the reference names, spelled exactly as it spells them. An
unrecognized top-level key would only be stripped at load time anyway, never an error.
This warning is the older local CLI's complaint restated, and the answer is the same:
keep the keys.

### The steps after Source

- **Listing details** — read from `plugin.json` and the README, not typed in. To change
  anything there, edit the repository and validate again.
- **Data handling** — four questions. The answers are below, under
  [Data handling answers](#data-handling-answers).
- **Compliance** — the contact email and four acknowledgements.
- **Review and submit** — confirm, choose how new versions arrive (**GitHub push
  webhook** is the default and needs repository admin access to set up), then **Submit for
  review**. The **Auto-publish passing versions** toggle lives here.

### Data handling answers

Checked against Vereel's own privacy policy, not assumed: the section numbers below are
its, at <https://www.vereel.com/en/privacy>.

**Does the plugin read or store personal data? Reads, stores none.**

> The plugin reads personal data through its one declared connector and stores none of
> its own. For a signed-in brand it reads that brand's own campaigns — name, description,
> deliverables, platforms, category, compensation, follower minimum, apply-by date,
> photos, status and Vereel's reviewer note. For a signed-in creator it reads their
> portfolio: the headline, the about text, the niches, and the figures Vereel reads from
> their connected platforms. With no sign-in it reads only public campaign data, exactly
> what an anonymous visitor of vereel.com sees, with no payment amounts. It writes a
> campaign in review, photos on it, and the creator's portfolio draft, into that person's
> own Vereel account. The plugin itself is five  files and one 
> naming a single URL: no hooks, no scripts, no , no , no local state,
> nothing it keeps.

**Does it send data to services other than its declared connectors? No.**

> One destination over HTTPS: , the declared connector.
> The plugin sends nothing anywhere else and carries no analytics or telemetry of its
> own. Vereel the service processes that data with subprocessors under data processing
> agreements — Supabase, Vercel, Stripe, Resend, Sentry, PostHog, Google, Cloudflare and
> Upstash — listed in section 11 of its privacy policy. Vereel does not sell personal
> data.

**How long does it keep data? The plugin keeps nothing.**

> What the connection writes lives in the person's own Vereel account under Vereel's
> retention rules, set out in section 14 of its privacy policy: account and profile data
> while the account exists, then erased or anonymised on deletion. The OAuth token is
> held by the Claude client, not by the plugin, and the connection can be revoked at any
> time under Connected apps in Vereel settings.

**Is it intended for people under 18? No — with one thing not to hide.**

Vereel's privacy policy, section 21, says the platform "is intended for people aged **16
or over**", not 18. The answer to the portal's question is still no, because the question
asks who the plugin is *for*, and whoever installs it holds a Claude account. Where the
form allows free text, say so rather than leaving it out:

> Not directed at or designed for children. It is a tool for brands and creators running
> marketing campaigns. Vereel's own minimum age is 16, stated in section 21 of its
> privacy policy, so a 16- or 17-year-old creator may hold a Vereel account; the plugin
> is not aimed at them and adds nothing for them.

A passing version is **not live until it is published**: by default you select **Publish**
and an Anthropic reviewer publishes it.

Two portal limits worth knowing before clicking: an organization may create **10
submissions per 24 hours**, drafts and withdrawn submissions included; and one submission
per repository-and-folder pair, so continue the existing one from **Submissions** rather
than starting a second.

### What the directory's checks should find

Deliberately avoided, because each one is a block or a reviewer hold:

- **No package launcher.** The plugin declares the remote server by `url`; it never runs
  `npx` or any other launcher, so neither the unpinned-launcher block nor the
  pinned-package hold applies.
- **No lockfile and no `package.json`** in the plugin folder, which would otherwise be
  held as a dependency install. The npm package's own files stay at the repository root,
  outside the plugin folder — which is also why the plugin path cannot be left empty.
- **No hooks, no scripts, no `bin/`.** Nothing to follow, and nothing that stops the
  plugin from installing on claude.ai and Cowork.
- **No credentials anywhere**, in the files or the examples, and no `userConfig`.
- **One remote server over HTTPS**, declared with `type: "http"` and an absolute `url`.
- **README of well over 40 words with a "Privacy Policy" section**, naming everything the
  plugin sends and where.
- **`LICENSE` in the plugin folder** and `license` set in the manifest.
- **Every file is text or a PNG**, each far below the 256 KiB limit for non-images.

### Not tested

The skills have not been run against real prompts, with the plugin loaded, to see whether
they change the output. Anthropic's checklist asks for that separately from validation,
and `claude plugin eval` is the tool for it. Loading the plugin on each surface — chat,
Cowork, Claude Code — is also untested.
