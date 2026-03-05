Commit all pending changes and push them to the remote git repository.

1. Run `git status` to check for pending changes.
2. If there are no changes, inform the user and stop.
3. Run `git diff --stat` and `git diff --staged --stat` to summarize what changed.
4. Stage all changes with `git add -A`.
5. Generate a concise, conventional commit message based on the changes. Use conventional commit format (e.g. `feat:`, `fix:`, `chore:`, `refactor:`).
6. Show the user the proposed commit message and the list of changed files. Ask for confirmation before committing.
7. Once confirmed, commit with the message.
8. Push to the current branch's remote tracking branch. If no upstream is set, push with `git push -u origin <current-branch>`.
9. Report the result to the user.
