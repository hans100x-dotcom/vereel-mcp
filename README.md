# Vereel Influencer Marketing MCP server

**Find verified influencers for your brand by talking to your AI assistant.**

[Vereel](https://www.vereel.com) is an influencer-marketing marketplace: brands and companies publish *offers* (campaigns), and creators on Instagram, TikTok, YouTube and X apply to them.

This MCP server lets **brands and companies add their offers to Vereel from Claude, Cursor and other AI agents**, so creators can find them and apply, and lets anyone **search the offers that are already public**. Describe your campaign in plain language; the assistant fills in the offer, attaches a photo and sends it to Vereel.

```
You:     Add a campaign to Vereel: we're launching a vitamin C serum. We want one Reel and two Stories
         from beauty creators on Instagram and TikTok, 800 PLN plus the product, creators with at
         least 5,000 followers. Use the photo at /Users/me/Desktop/serum.jpg.

Claude:  I'll check Vereel's categories first… Here is the offer I'm about to send. Shall I go ahead?
You:     Yes.
Claude:  Done. "Spring skincare launch" is waiting for Vereel's review; it goes public once it is approved.
```

## What you can do

| Tool | What it does | Needs a brand token |
|---|---|---|
| `vereel_create_offer` | Add an offer to Vereel. It waits for review before it goes public. | yes (read and write) |
| `vereel_add_offer_image` | Add a photo to an offer: from a link, or from a file on your computer. | yes (read and write) |
| `vereel_update_offer` | Change an offer while it is still in review. | yes (read and write) |
| `vereel_list_my_offers` | List your offers and where each one stands (in review, public, rejected). | yes |
| `vereel_get_my_offer` | One of your offers in full, with what is still missing and the reviewer's note. | yes |
| `vereel_list_categories` | The categories offers are filed under. | no |
| `vereel_search_offers` | Search the public offers by words, category, type, platform and language. | no |
| `vereel_get_offer` | One public offer, with what its page on vereel.com shows. | no |

Searching public offers needs no account and no token. Everything else acts for **your brand**, through a token you create.

## What happens to an offer

Every offer sent through this server **waits for a Vereel admin to approve it** before creators can see it. It needs at least one photo to be approved. While it waits you can still change it and add photos. If Vereel rejects it, the offer goes back to your drafts with the reason, and `vereel_get_my_offer` shows the note.

The API cannot publish, delete, pay or start a cooperation: those stay in Vereel, in your hands.

## Set up

**1. Have a Vereel brand account.** No account yet? Sign up as a brand at [vereel.com](https://www.vereel.com).

**2. Create a token.** In Vereel open **Settings › API tokens**, choose *Read and write*, accept the Cooperation Terms for the token, and create it. The token (it starts with `vrl_`) is shown **once**: copy it now. Offers sent with it fall under the [Cooperation Terms](https://www.vereel.com/en/terms/cooperation).

**3. Add the server to your AI client.** You need [Node.js](https://nodejs.org) 20 or newer.

<details open>
<summary><b>Claude Desktop</b></summary>

Open *Settings › Developer › Edit Config* and add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vereel": {
      "command": "npx",
      "args": ["-y", "github:hans100x-dotcom/vereel-mcp"],
      "env": { "VEREEL_API_TOKEN": "vrl_paste-your-token-here" }
    }
  }
}
```

On Windows, if Claude cannot start `npx`, use `"command": "cmd"` and `"args": ["/c", "npx", "-y", "github:hans100x-dotcom/vereel-mcp"]`. Restart Claude Desktop.
</details>

<details>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add vereel --env VEREEL_API_TOKEN=vrl_paste-your-token-here -- npx -y github:hans100x-dotcom/vereel-mcp
```
</details>

<details>
<summary><b>Cursor</b></summary>

Add to `.cursor/mcp.json` (or *Settings › MCP*):

```json
{
  "mcpServers": {
    "vereel": {
      "command": "npx",
      "args": ["-y", "github:hans100x-dotcom/vereel-mcp"],
      "env": { "VEREEL_API_TOKEN": "vrl_paste-your-token-here" }
    }
  }
}
```
</details>

<details>
<summary><b>Any other MCP client</b></summary>

Run `npx -y github:hans100x-dotcom/vereel-mcp` as a stdio server with `VEREEL_API_TOKEN` in its environment.
</details>

**4. Ask.** For example:

- *"Show me the Vereel categories, then add a campaign for our new running shoes for Instagram and TikTok."*
- *"Which of my Vereel offers are still waiting for review?"*
- *"Search Vereel for travel campaigns on YouTube."*

Leave the token out and the server still searches public offers.

## Configuration

Set these as environment variables of the server:

| Variable | Meaning |
|---|---|
| `VEREEL_API_TOKEN` | Your brand token (`vrl_…`). Without it the server can only search public offers. |
| `VEREEL_READ_ONLY` | `1` hides the tools that create or change offers. Use it with a token you only want to read with. |
| `VEREEL_IMAGE_DIRS` | Folders the assistant may upload photos from, separated by `;` on Windows and `:` elsewhere. Default: any folder. Setting it is a good idea. |
| `VEREEL_API_URL` | Default `https://www.vereel.com/api/v1/public`. `http://` is accepted only for `localhost`. |

Vereel can switch its API off at any time; the tools then answer `API_DISABLED` and say to try again later.

## Security

You are giving an AI assistant a key to your brand's account, so the safeguards come in several layers.

- **A token can only do a little.** It can create and edit offers that wait for review, add photos, and read. It cannot publish, delete, pay, see other brands' offers or create tokens. Tokens expire (30, 90 or 365 days), can be revoked in Settings, and show when they were last used. Vereel stores only a hash of them.
- **Nothing goes public unannounced.** A Vereel admin approves every offer, and can switch the whole API off.
- **Offer text is treated as data.** Descriptions on public offers are written by other people. Every result that carries such text starts with a notice telling the assistant not to follow instructions found inside it.
- **Photos are checked on your machine first.** A file is read and sent only if its *content* is a JPEG, PNG or WebP of at most 5 MB, whatever its name. Nothing else leaves your computer, even if an assistant is tricked into asking. `VEREEL_IMAGE_DIRS` limits the folders as well.
- **The token goes to Vereel and nowhere else.** It is sent only as a header, only to `VEREEL_API_URL`, never on anonymous requests, never to the photo upload address, and redirects are refused. It is never written to logs or shown in results.
- **No automatic retries.** A request that gets no answer is reported, not repeated, so an offer is not created twice.
- **Keep the token private.** Put it in your client's configuration, not in a chat, a repository or a web page. If it leaks, revoke it in **Settings › API tokens** and make a new one.

Found a vulnerability? Please email **contact@vereel.com** rather than opening a public issue.

## Limits

Set by Vereel's API: 60 anonymous requests a minute per address; per token 120 requests a minute and 30 changes per 10 minutes; 20 offers in review and 50 new offers a day per brand; bodies up to 64 KB; at most 6 photos per offer. The tools pass Vereel's error on, with what to do next.

## Documentation

- Vereel's API documentation: <https://www.vereel.com/en/api>
- OpenAPI definition: <https://www.vereel.com/api/v1/public/openapi.yaml>

This server is a thin layer over that API. If you prefer plain HTTP, use the API directly.

## Development

```bash
git clone https://github.com/hans100x-dotcom/vereel-mcp.git
cd vereel-mcp
npm install        # also builds
npm test           # no network needed
npm run typecheck
node dist/index.js --help
```

The tools' inputs mirror the API definition, which is kept in `spec/openapi.json`. `test/spec-drift.test.ts` compares the two field by field; when Vereel changes its API, run `npm run sync-spec` and the test says what to update.

To try the server against a local Vereel, set `VEREEL_API_URL=http://localhost:3000/api/v1/public`.

```
src/
  index.ts     start-up: reads the environment, speaks MCP on stdin/stdout
  server.ts    creates the MCP server and its instructions
  tools.ts     the eight tools
  schemas.ts   the tools' inputs
  client.ts    the only code that talks to Vereel
  results.ts   what the model reads back: data, notices, errors with hints
  images.ts    reading a photo from disk, judged by its content
  config.ts    environment and its checks
```

## Roadmap

- A hosted (Streamable HTTP) server with sign-in through OAuth, so Vereel can be added as a connector in Claude and ChatGPT without handling a token.
- A listing in the MCP Registry.

## License

[Apache-2.0](LICENSE)
