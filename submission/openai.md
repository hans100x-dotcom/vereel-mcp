# OpenAI: ChatGPT and Codex plugin directory

Submitted as a **ZIP upload** at [platform.openai.com/plugins](https://platform.openai.com/plugins)
with **Upload new or existing plugin**. OpenAI's docs call these *plugins*, not apps.

Who can submit: an organization owner, or a member with **Apps Management** write access.
Individual or business identity verification is required to publish under a name.

---

## Blocked on one thing, and it is not OpenID Connect

An earlier version of this file said OpenID Connect was required and that "the
submission cannot pass review without the first". **That was wrong**, and acting on
it would have meant building an enterprise identity feature before a listing that
does not ask for it. Checked against OpenAI's current documentation on 2026-11-17:

- [Authentication](https://developers.openai.com/plugins/build/auth.md) puts the UserInfo
  endpoint and the `openid`/`email` scopes under **Support workspace domain
  restrictions** — the feature by which an enterprise workspace restricts an app to its
  own email domain. The sentence "the UserInfo Endpoint is required" belongs to that
  feature, not to submission.
- [Remote MCP server review requirements](https://developers.openai.com/plugins/deploy/app-review.md)
  does not mention OIDC or UserInfo at all.
- [Plugin submission errors](https://developers.openai.com/plugins/deploy/submission-errors.md)
  lists no error code for OIDC, UserInfo, or the `email` claim. The only blocking
  domain-related code is `domain_verification_required`.

### The one blocker: the domain-verification file

The portal issues a challenge token that must be served as **plain text, the token and
nothing else**, at:

```
https://www.vereel.com/.well-known/openai-apps-challenge
```

The token does not exist until a person opens the portal. The route is in place and
waiting for it: `vereel` issue #1684 added `/.well-known/openai-apps-challenge`, which
serves the `OPENAI_APPS_CHALLENGE` environment variable verbatim and answers `404` while
it is unset. **Going live is one Vercel variable on production plus a redeploy** — no code
change, no pull request. The challenge host must be the MCP hostname or an eligible parent
domain, and `www.vereel.com` serves the MCP endpoint, so it qualifies.

### Do not advertise `openid` and `email` yet

ChatGPT requests every scope the authorization server advertises in `scopes_supported`,
and a server that does not grant all of them back fails the client with a scope mismatch.
So adding `openid` and `email` to Vereel's metadata before a UserInfo endpoint answers
would break the connection rather than improve it. `scopes_supported` stays
`offers:read offers:write`, and `defaultScopes` in `mcp.json` matches it.

OIDC is therefore a **decision, not a blocker**: build it when enterprise workspaces that
restrict apps by email domain are worth serving, and advertise the scopes in the same
change as the endpoint, never before.

## The package

The ZIP is the [`plugin/`](../plugin/) folder. Its OpenAI-facing files:

| File | What it is |
|---|---|
| `plugin.json` | The portable manifest, with the listing under `extensions.com.openai.interface` |
| `mcp.json` | The remote server, with auth under `extensions.com.openai.auth` |
| `skills/<name>/SKILL.md` | Six skills, shared with the Claude plugin |
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
| `capabilities` | nine entries | 20 items, 120 characters each |
| `defaultPrompt` | three prompts: add a campaign, read the applicants, search without an account | 3 prompts, 128 characters each |
| `brandColor` | `#007B80` | needs 2:1 against white; this is 5.07:1 |
| `logo` | `./assets/icon.png` | PNG/JPEG/WebP/SVG, ≤5 MiB, square, ≥48×48 |

`brandColor` is Vereel's own accent, `oklch(49% 0.18 195)` in the application's
stylesheet, converted to sRGB.

### Still to fill in

- **`category`** — left unset on purpose. The dashboard's list is not public, and the
  error codes include `plugin_category_unknown`, so a guess that is not on the list is an
  error, while there is no `plugin_category_missing` code to fire for an absent one. A
  person picks it in the portal.
- **`composerIcon`** — now set to `./assets/icon.png`, the same square 512×512 PNG as the
  logo. OpenAI's own documentation uses exactly that path in its example and asks only
  that the asset sit under `./assets/`, and `plugin_composer_icon_path_missing` fires for
  a declared path with no file behind it, which this is not. A composer icon is usually a
  simplified glyph rather than a full logo, so a dedicated asset would read better in the
  composer; this is correct, not final.
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
