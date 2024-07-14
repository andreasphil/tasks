<h1 align="center">
  Tasks 🌺
</h1>

<p align="center">
  <strong>Simple, plain-text productivity</strong>
</p>

<p align="center">
<a href="https://app.netlify.com/sites/andreasphil-tasks/deploys">
   <img src="https://api.netlify.com/api/v1/badges/508e3f7f-df54-4326-bb55-4b4cae9a7dd2/deploy-status" alt="Netlify Status" />
</a>
</p>

> ⚠️ Work in progress. Things are most certainly incomplete and/or broken, and will definitely change.

- ✅ Manage your tasks with a simple, text-based format
- 🦦 Add sections, notes, due dates and tags
- 🚀 Minimal UI and efficient, keyboard-driven UX
- ⚡️ PWA & offline ready (coming soon!)
- 🤝 Zero tracking and no data ever leaves the browser

## Usage

Find the app at <https://tasks.a13i.dev>.

Here's an example:

```txt
Getting started

A line like this that doesn't have any special formatting is a note. Notes don't have any special meaning and are just there to help you structure your file and remember things.

One exception is the first line, which is the title of the page.

[ ] This is a task
[/] This task is in progress
[?] Tasks with a question mark are waiting for something
[*] Something important can be marked with an asterisk
[x] Once a task is done, cross it off the list with an x

# This is a section

Sections are a great way to group tasks and notes.

[ ] Tasks can have #tags
[ ] ...and due dates @2021-12-31
[ ] Add an URL anywhere and it will turn into a link: https://example.com
```

Most actions such as creating or removing pages, converting between different types of content, updating status, backups, etc. can be done via the command menu. Click `⌘ Go to anything` in the sidebar to open it, or press <kbd>⌘ K</kbd>.

## Development

The site is a [Vue 3](https://vuejs.org) app built with [Vite](https://vitejs.dev). Packages are managed by [pnpm](https://pnpm.io). Tests are powered by [Vitest](https://vitest.dev). The following commands are available for developing and running the app:

```sh
pnpm run dev       # Start development server
pnpm run build     # Create a production bundle
pnpm run preview   # Serve the production bundle locally
pnpm run test      # Run tests
```

## Deployment

Deployment should work out of the box when linking the repository to a project on [Netlify](https://netlify.com).

## Credits

Apart from the open source packages listed in [package.json](package.json), Tasks was inspired by [Bullet Journal](https://bulletjournal.com), [TaskTXT](https://tasktxt.com), and [[x]it!](https://xit.jotaen.net).

Thanks 🙏
