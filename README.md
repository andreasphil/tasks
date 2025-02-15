<h1 align="center">
  Tasks 🌺
</h1>

<p align="center">
  <strong>Simple, plain-text productivity</strong>
</p>

- ✅ Manage your tasks with a simple, text-based format
- 🦦 Add sections, notes, due dates and tags
- 🏄‍♂️ Board view for easy status tracking
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

Tasks is a [Vue 3](https://vuejs.org) app built with [Vite](https://vitejs.dev). Packages are managed by [npm](https://npmjs.org). Tests are powered by [Vitest](https://vitest.dev). The following commands are available:

```sh
node --run dev          # Start development server
node --run test         # Run tests once
node --run test:watch   # Run tests in watch mode
node --run typecheck    # Typecheck
node --run build        # Bundle for production
```

## Deployment

Deployment should work out of the box on GitHub Pages.

## Credits

This app uses a number of open source packages listed in [package.json](package.json). It was inspired by [Bullet Journal](https://bulletjournal.com), [TaskTXT](https://tasktxt.com), and [[x]it!](https://xit.jotaen.net).

Thanks 🙏
