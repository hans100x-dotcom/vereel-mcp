# OpenAI: ChatGPT and Codex plugin directory

Submitted as a **ZIP upload** at [platform.openai.com/plugins](https://platform.openai.com/plugins)
with **Upload new or existing plugin**. OpenAI's docs call these *plugins*, not apps.

Who can submit: an organization owner, or a member with **Apps Management** write access.
Individual or business identity verification is required to publish under a name.

---

## Blocked on two things

Neither can be done from this repository, and the submission cannot pass review without
the first.

### 1. OpenID Connect on Vereel's OAuth server

OpenAI requires, for a plugin with a remote MCP server using OAuth:

> expose a UserInfo Endpoint that returns the `email` claim and `email_verified: true`,
> and advertise and enable the `openid` and `email` scopes

Vereel does none of that today. Checked against production on 2026-11-17:

- `/.well-known/oauth-authorization-server` advertises
  `scopes_supported: ["offers:read", "offers:write"]` — no `openid`, no `email`.
- It carries no `userinfo_endpoint`.
- `/.well-known/openid-configuration` answers `404`.

This is work in the `vereel` application: the scopes, a UserInfo endpoint, and the
metadata that advertises both. Anthropic asks for none of it, so the Claude submission is
not waiting on this.

### 2. The domain-verification file

The portal issues a challenge token that must be served as **plain text, the token and
nothing else**, at:

```
https://www.vereel.com/.well-known/openai-apps-challenge
```

That path answers `404` today. The token does not exist until a person opens the portal,
so this is: open the portal, take the token, add the route in the `vereel` application,
deploy, then continue the submission. The challenge host must be the MCP hostname or an
eligible parent domain — `www.vereel.com` serves the MCP endpoint, so it qualifies.

---

## The package

The ZIP is the [`plugin/`](../plugin/) folder. Its OpenAI-facing files:

| File | What it is |
|---|---|
| `plugin.json` | The portable manifest, with the listing under `extensions.com.openai.interface` |
| `mcp.json` | The remote server, with auth under `extensions.com.openai.auth` |
| `skills/<name>/SKILL.md` | Five skills, shared with the Claude plugin |
| `assets/icon.png` | 512×512 PNG, 25 KB — square and well over the 48×48 minimum |

`mcp.json` declares one server:

```json
{
  "type": "streamable-http",
  "url": "https://www.vereel.com/api/mcp",
  "extensions": {
    "com.openai": {
      "auth": {
        "type": "oauth",
        "client": { "mode": "dcr" },
        "defaultScopes": ["offers:read", "offers:write"]
      }
    }
  }
}
```

`dcr` is right because Vereel advertises a `registration_endpoint`; `cimd` would also
work, since `client_id_metadata_document_supported` is `true`. No client secret goes in
the package, and the manifest does not accept one. `authorizationUrl` and `tokenUrl` are
left out on purpose: discovery supplies them.

**`defaultScopes` will have to grow** to include `openid` and `email` once blocker 1 is
done. It is left honest for now rather than claiming scopes the server refuses.

### What is deliberately absent

OpenAI's guide for converting a Claude plugin says to remove these for a public
submission, and none of them is here: `hooks/hooks.json`, `settings.json`, `CLAUDE.md`,
`.claude/settings*.json`, `userConfig` and `${user_config.*}`, `outputStyles`,
`lspServers`, `experimental.themes`, `experimental.monitors`, `channels`, `dependencies`,
`bin/`, and `.claude-plugin/marketplace.json`. There are no `commands/` or `agents/` to
convert — everything is already a skill.

`.claude-plugin/plugin.json` and `.mcp.json` stay in the folder for Anthropic. On a direct
Claude-archive upload OpenAI's portal converts `.claude-plugin/plugin.json` into
`.codex-plugin/plugin.json` and fills in interface defaults; read the generated file
afterwards rather than trusting it.

The skills avoid naming any one assistant, as OpenAI asks, and none of them tells the
model to create a Claude artifact.

---

## Listing metadata

Already in `plugin.json` under `extensions.com.openai.interface`, with OpenAI's limits:

| Field | Value | Limit |
|---|---|---|
| `displayName` | `Vereel` | 30 |
| `shortDescription` | `Influencer campaigns` | 30 |
| `longDescription` | in `plugin.json` | 4000 |
| `developerName` | `Vereel` | 80 |
| `websiteURL` | `https://www.vereel.com` | 1024, HTTPS |
| `supportURL` | `https://www.vereel.com/en/contact` | 1024, HTTPS |
| `privacyPolicyURL` | `https://www.vereel.com/en/privacy` | 1024, HTTPS |
| `termsOfServiceURL` | `https://www.vereel.com/en/terms` | 1024, HTTPS |
| `capabilities` | seven entries | 20 items, 120 characters each |
| `defaultPrompt` | three prompts | 3 prompts, 128 characters each |
| `brandColor` | `#007B80` | needs 2:1 against white; this is 5.07:1 |
| `logo` | `./assets/icon.png` | PNG/JPEG/WebP/SVG, ≤5 MiB, square, ≥48×48 |

`brandColor` is Vereel's own accent, `oklch(49% 0.18 195)` in the application's
stylesheet, converted to sRGB.

### Still to fill in

- **`category`** — required, from the dashboard's list, which is not public. A person
  picks it.
- **`composerIcon`** — required for Codex. No separate asset exists; `assets/icon.png`
  may be acceptable, but that has not been confirmed against the portal.
- **`developerName`** — `Vereel` is a placeholder for whatever name the identity
  verification is issued to. If the verified name is the legal entity, use that.
- **`publication.countries`** — an optional availability allowlist. Left unset, which
  means no restriction. It is not a data-residency setting.

---

## Review details

Entered in the portal, **not in the package**.

- **`demo_recording_url`** — required, and **nobody has recorded it.** A reviewer must be
  able to open it. Suggested run: ask for a campaign in plain words, watch it being
  written, see it land in review, then show it being published at vereel.com.
- **Reviewer credentials** — a dedicated test account with a login URL and sign-in
  instructions. OpenAI's requirement is explicit: the account "should work immediately
  without MFA approval, email or SMS codes, magic links, or private-network access." Use a
  seeded brand account on production, never a real customer's, and never commit the
  password to this repository.
- **Test cases** — five positive and three negative, drafted in
  [`test-cases.md`](test-cases.md).

OpenAI rejects trial or demo plugins, and connectors that mainly pass through to another
service. Vereel is the service, and this is its own API, so neither should apply.
