# Directory submission artefacts

Everything needed to list Vereel in Anthropic's and OpenAI's directories, prepared so a
person only has to open the portal, paste, and answer the questions that need a human.

| File | What it holds |
|---|---|
| [`anthropic.md`](anthropic.md) | The MCP connector listing and the plugin submission, step by step |
| [`openai.md`](openai.md) | The ChatGPT/Codex plugin package and listing |
| [`test-cases.md`](test-cases.md) | The five positive and three negative test cases OpenAI requires |

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

**Needs a change in the `vereel` application, not in this repository:**

1. **OpenID Connect, for OpenAI only.** OpenAI requires the OAuth server to expose a
   UserInfo endpoint returning the `email` claim and `email_verified: true`, and to
   advertise and enable the `openid` and `email` scopes. Vereel advertises
   `offers:read` and `offers:write` only, has no `userinfo_endpoint` in its metadata, and
   answers `404` at `/.well-known/openid-configuration`. **The ChatGPT submission cannot
   pass review until this exists.** Anthropic does not ask for it.
2. **The OpenAI domain-verification file.** OpenAI's portal issues a token that must be
   served as plain text at `https://www.vereel.com/.well-known/openai-apps-challenge`.
   That path answers `404` today. The token only exists once a person opens the portal,
   so this is a two-step job: get the token, then add the route.

**Needs a person, and cannot be prepared here:**

3. A Claude account on a paid plan, with the GitHub account connected in the same Claude
   organization and able to push to this repository.
4. An OpenAI organization with individual or business identity verification, and
   **Apps Management** write access.
5. The listing **category** for each directory, chosen from the list each portal shows.
   Neither list is public, so no value is filled in here.
6. A **demo recording** reachable by a reviewer, which OpenAI requires for MCP review.
7. A **reviewer test account**: a seeded brand account that is not a real customer's, and
   that signs in with a password — OpenAI's reviewers cannot use multi-factor approval,
   email or SMS codes, or magic links.
8. The **slug** for the Anthropic listing, which is permanent once published. `vereel` is
   proposed.

## One stale claim worth fixing first

The hosted server still tells models that a campaign "needs at least one photo before it
can be published", and this repository's root `README.md` says a campaign "goes public
once it is approved". Neither is true any more: the brand publishes its own campaign, and
the photo requirement was removed. Accurate descriptions are a submission requirement in
both directories, and a reviewer reads these words. The root README is corrected in the
same change as these artefacts; the hosted server's tool description is in the `vereel`
repository and is not.
