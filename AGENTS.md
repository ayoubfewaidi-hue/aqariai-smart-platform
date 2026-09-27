<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Roles live in `public.user_roles` (app_role: buyer|seller|admin) checked via `has_role()`; `profiles.role` is deprecated — prevents users self-escalating via profile updates.
- Protected pages use `ssr: false` + `beforeLoad: requireAuth(role?)` from `src/lib/auth-guard.ts`, redirecting to `/` — session lives in browser storage.
