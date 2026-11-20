# Directory submission artefacts

Everything needed to list Vereel in Anthropic's and OpenAI's directories, prepared so a
person only has to open the portal, paste, and answer the questions that need a human.

| File | What it holds |
|---|---|
| [`anthropic.md`](anthropic.md) | The MCP connector listing and the plugin submission, step by step |
| [`openai.md`](openai.md) | The ChatGPT/Codex plugin package and listing |
| [`test-cases.md`](test-cases.md) | The five positive and three negative test cases OpenAI requires |
| [`reviewer-instructions.md`](reviewer-instructions.md) | The walkthrough pasted into OpenAI's **Review details**, and the script for the demo recording |

The plugin itself is [`../plugin/`](../plugin/). It is one folder that both directories
read: `.claude-plugin/plugin.json` and `.mcp.json` for Anthropic, `plugin.json` and
`mcp.json` for OpenAI, and one set of skills under `skills/` that serves both.

Both directories list the **hosted** connector at `https://www.vereel.com/api/mcp`, not
the npm package in this repository's root. The npm package stays as it is, for people who
would rather run the server themselves with a token.

## What is already true

Checked against production on 2026-11-17, not assumed:

- `https://www.vereel.com/api/mcp` answers `401` to `POST`, `GET` and `DELETE` with a
  `WWW-Authenticate: Bearer` challenge naming its resource metadata, and `204` to the
  cross-origin preflight.
- The three discovery documents answer `200`:
  `/.well-known/oauth-protected-resource`,
  `/.well-known/oauth-protected-resource/api/mcp` and
  `/.well-known/oauth-authorization-server`.
- Dynamic Client Registration (`registration_endpoint`) and Client ID Metadata Documents
  (`client_id_metadata_document_supported: true`) are both advertised, so neither
  directory needs a client secret from us.
- Every tool the hosted server exposes carries a `title` and a `readOnlyHint` or
  `destructiveHint` annotation, which Anthropic requires and the portal checks.
- Privacy policy, terms and a contact page are live at `/en/privacy`, `/en/terms` and
  `/en/contact`.

## What is not done, and who has to do it

Nothing in this folder can be submitted without these. They are listed again, with
detail, in the two platform files.

**Needs one value from the OpenAI portal, and nothing else in the `vereel`
application:**

1. **The OpenAI domain-verification token.** The portal mints a token that must be served
   as plain text at `https://www.vereel.com/.well-known/openai-apps-challenge`. The route
   exists (`vereel` issue #1684): it serves the `OPENAI_APPS_CHALLENGE` environment
   variable verbatim and answers `404` while it is unset. So this is **one Vercel
   variable on production plus a redeploy**, once a person has opened the portal and
   taken the token. `domain_verification_required` is the only blocking domain-related
   error code OpenAI documents.

**No longer on this list: OpenID Connect.** An earlier version said the ChatGPT
submission could not pass review without a UserInfo endpoint and the `openid`/`email`
scopes. That was wrong. Those belong to OpenAI's **workspace domain restrictions**, an
enterprise feature; neither the remote-MCP review requirements nor the submission error
list mentions them. It is a decision about serving enterprise workspaces, not a blocker
— and the scopes must not be advertised before the endpoint answers, because ChatGPT
requests every advertised scope and fails when the server does not grant them all back.
See [`openai.md`](openai.md).

**Needs a person, and cannot be prepared here:**

2. A Claude account on a paid plan, with the GitHub account connected in the same Claude
   organization and able to push to this repository.
3. An OpenAI organization with individual or business identity verification, and
   **Apps Management** write access.
4. The listing **category** for each directory, chosen from the list each portal shows.
   Neither list is public, so no value is filled in here.
5. A **demo recording** reachable by a reviewer, which OpenAI requires for MCP review.
6. A **reviewer test account**: a seeded brand account that is not a real customer's, and
   that signs in with a password — OpenAI's reviewers cannot use multi-factor approval,
   email or SMS codes, or magic links.
7. The **slug** for the Anthropic listing, which is permanent once published. `vereel` is
   proposed.

## The stale claim that is left, and where it lives

Fixed in this repository: the root `README.md` and the local server's own tool
descriptions no longer say that Vereel reviews an offer and publishes it once approved,
and no longer claim a photo is needed before it can be published.

**Still wrong, in the `vereel` repository, not this one:** the hosted server tells models
in `vereel_create_offer` that a campaign "needs at least one photo before it can be
published", and repeats it in the hint after a save. Checked against `publishBlockers` on
`main`: publishing calls `wizardErrors` with `requireImage: false`, and the comment above
it says a photo is deliberately not a gate because a campaign without one merely looks
plainer, which the brand can see for itself. The apply-by date is the real gate.

Accurate descriptions are a submission requirement in both directories, and a reviewer
reads these words. This is one sentence in
`src/vereel/src/lib/public-api/mcp-tools.ts`.
