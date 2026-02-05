# Create GitHub Pull Request Workflow

## Prerequisites Check

1. Verify all changes are committed:
   - Run `git status --short` - should show no modified/untracked files (except temporary PR files)
   - If uncommitted changes exist, prompt user to commit first
2. Verify branch is pushed to remote:
   - Run `git log origin/main..HEAD --oneline` - should show commits
   - If no commits ahead, check if branch exists on remote: `git ls-remote --heads origin $(git branch --show-current)`
   - If not pushed, prompt user to push first

## Extract Information from Branch Name

- Branch format: `{linear-issue}-story-{story-number}-{description}` or similar
- Extract Linear issue ID (e.g., "MES-47" from "feature/mes-47-story-13-create-messy-shared-package")
- Extract story number (e.g., "1.3" from "story-13" or "story-1-3")
- Extract description from branch name for title (can be feature or fix)

## Create PR Title

Format: `{prefix}: {Description} ({Linear-Issue-ID}, Story {Story-Number})`

- Determine prefix from branch name/title:
  - Use `fix:` if branch/title contains keywords like "fix", "bug", "error", "issue", "repair", "resolve"
  - Use `feat:` for new features or enhancements
  - Default to `feat:` if uncertain
- Examples:
  - "feat: Initialize Monorepo and uv Workspace (MES-45, Story 1.1)"
  - "feat: Create messy-shared Package (MES-47, Story 1.3)"
  - "fix: Resolve Authentication Token Expiration (MES-52, Story 2.1)"
  - "fix: Fix Database Connection Pool Error (MES-48, Story 1.5)"
- Keep title concise and descriptive

## Create PR Description

1. Use template from `.github/PULL_REQUEST_TEMPLATE.md`
2. Fill in sections with concise, factual information:
   - Keep responses brief - no verbose text needed
   - Focus on what changed, why, and how to test
   - Reference story file if available: `.bmad-ephemeral/stories/{story-file}.md`
3. Save description to temporary file `PR_DESCRIPTION.md` in workspace root
4. Use this file when creating the PR via GitHub CLI or API

## Post Story Content to Linear Issue (Optional Enhancement)

**Note**: This step enhances the Linear issue with full story context. If it fails, continue with PR creation.

1. **Resolve Linear Issue ID**:
   - Extract Linear issue identifier from branch name (e.g., "mes-47" → "MES-47")
   - Convert to uppercase format: `{prefix}-{number}` (e.g., "MES-47")
   - Use `mcp_linear_get_issue` with the issue ID to verify it exists
   - If issue not found, try searching with `mcp_linear_list_issues` using the issue ID as query
   - If still not found, skip this step and continue with PR creation

2. **Find Story File**:
   - Construct story key from extracted story number: `{epic}-{story}-{description}`
   - Example: story number "1.3" → look for `1-3-*.md` in `.bmad-ephemeral/stories/`
   - Alternative: search all files in `.bmad-ephemeral/stories/` and match by story number
   - If story file not found, skip this step and continue with PR creation

3. **Read and Format Story Content**:
   - Read the complete story file content
   - Format as markdown for Linear comment (preserve structure, headers, code blocks, lists)
   - Add a header: `## Story Implementation Details\n\n` to introduce the content
   - Include the full story content (Story, Acceptance Criteria, Tasks, Dev Notes, Completion Notes, etc.)
   - Preserve markdown formatting (code blocks, lists, headers)

4. **Post Comment to Linear**:
   - Use `mcp_linear_create_comment` with:
     - `issueId`: The Linear issue ID (e.g., "MES-47")
     - `body`: The formatted story file content as markdown
   - If posting fails, log error but continue with PR creation (non-blocking)

## Run Tests and Verify All Pass

**Note**: This step is mandatory. PR creation will be blocked if tests fail.

1. **Run All Tests**:
   - From workspace root, run: `uv run pytest -v`
   - This auto-discovers and runs all test files (`test_*.py` and `*_test.py`) across the entire workspace
   - Verify exit code is 0 (all tests pass)
   - If tests fail, display error output and **block PR creation**
   - Prompt user to fix failing tests before proceeding

2. **Handle Test Failures**:
   - If tests fail, do NOT create the PR
   - Display clear error message: "Tests failed. Please fix failing tests before creating PR."
   - Show the test output to help user debug
   - Stop workflow execution
   - Do NOT proceed to PR creation step

3. **On Success**:
   - Display test summary (e.g., "All tests passed: 25 passed in 1.05s")
   - Continue to PR creation step

## Create Pull Request

- Target branch: `main`
- Use the generated title and description
- If using GitHub CLI: `gh pr create --base main --title "{title}" --body-file PR_DESCRIPTION.md`
- If using API or web interface, use the same title and body content

## Cleanup

- After PR is successfully created, delete the temporary `PR_DESCRIPTION.md` file
- Verify deletion: `rm PR_DESCRIPTION.md` (if it exists)

## Completion

- Answer: "done"
