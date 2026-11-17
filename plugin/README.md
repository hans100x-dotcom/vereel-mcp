# Vereel

Add influencer-marketing campaigns to [Vereel](https://www.vereel.com) by describing them
in plain language, and search the campaigns brands have already published.

Vereel is an influencer-marketing marketplace. Brands publish campaigns, and creators on
Instagram, TikTok, YouTube and X apply to them. This plugin writes a campaign into the
brand's own Vereel account from a brief: the name and description, the deliverables, the
platforms, the category, the compensation, the follower minimum, the apply-by window and
up to six photos.

**Nothing here goes public on its own.** A campaign added through this plugin arrives in
the brand's Vereel account in review. The brand publishes it themselves at vereel.com,
where they see a preview of the campaign as creators will see it and accept the
Cooperation Terms for it. The plugin cannot publish, delete, pay, or accept a creator's
application.

## What it does

| Skill | What it is for |
|---|---|
| `getting-started` | What Vereel is, what the connection can and cannot do |
| `create-campaign` | Turn a brief into a complete campaign and send it to Vereel |
| `track-campaigns` | Where the brand's campaigns stand; change one still in review |
| `browse-offers` | Search the campaigns that are already public |
| `creator-portfolio` | Read and rewrite the draft texts of a creator's portfolio |

## What it connects to

The plugin declares one remote MCP server and nothing else. It runs no scripts, installs
no packages, starts no local process, and reads no files on your computer.

- **Endpoint:** `https://www.vereel.com/api/mcp`, over HTTPS, Streamable HTTP.
- **Sent there:** only the arguments of the tool being called — the campaign fields you
  approve, a search query, a campaign id, or portfolio text. Image links you pass are
  downloaded by Vereel from the address you give.
- **Sent anywhere else:** nothing. There is no telemetry and no third-party endpoint.

### Tools

Read-only, and usable without an account: `vereel_list_categories`,
`vereel_search_offers`, `vereel_get_offer`.

Read-only, for the signed-in account: `vereel_list_my_offers`, `vereel_get_my_offer`,
`vereel_get_my_portfolio`.

Writing, for the signed-in account: `vereel_create_offer` (adds a campaign in review),
`vereel_update_offer` (changes a campaign that is still in review), `vereel_add_offer_image`
(adds one photo), `vereel_update_my_portfolio` (replaces a portfolio draft text).

## Signing in

Searching public campaigns and listing categories need no account. Everything else signs
in on vereel.com with OAuth 2.0, in the flow your client offers. You choose whether the
connection may only read your campaigns or also create them; creating also asks you to
accept Vereel's Cooperation Terms.

No token, password or API key is ever entered into the conversation or stored in this
plugin. Disconnect the connection at any time under **Connected apps** in your Vereel
settings.

## Privacy Policy

Vereel's privacy policy: <https://www.vereel.com/en/privacy>.
Terms of service: <https://www.vereel.com/en/terms>.

**What is collected.** Vereel receives the arguments of each tool call you approve: the
fields of a campaign you are adding or changing, search queries, campaign ids, and
portfolio text. For a signed-in connection, Vereel associates these with your Vereel
account, as it does for anything you do in the app itself. Image URLs you pass are
fetched by Vereel's servers so the image can be stored with the campaign.

**Why.** To create and change the campaigns and portfolio content you ask for, and to
return the public campaign data you search for.

**Who sees it.** Vereel, and — once you publish a campaign — the creators who can see
that campaign on Vereel, exactly as with a campaign written in the app. Campaigns in
review may be read by Vereel staff reviewing them. Nothing is sold, and nothing is sent
to a third party by this plugin.

**How long.** Campaign and portfolio data lives in your Vereel account until you delete
it or close the account, under the retention described in Vereel's privacy policy.

**What you control.** Disconnect the connection under **Connected apps** in your Vereel
settings, which stops all access immediately. Delete or edit campaigns and portfolio
content in the Vereel app.

**Contact.** <https://www.vereel.com/en/contact>.

## Running the server yourself

The same tools are available as an open-source MCP server you run on your own computer
with an API token, instead of this hosted connection. See the repository root and
<https://www.vereel.com/en/api>.

## License

Apache-2.0. See `LICENSE`.
