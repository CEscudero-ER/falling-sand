# Falling Sand

A sandbox that runs in any web browser. Pick an element, paint it onto the
screen, and watch: sand piles up, water spreads out, fire burns wood, lava
turns water into steam, and plants drink it all up. Nobody controls what
happens next. Every grain just follows its own few rules, over and over.

Your team invents new elements by writing those rules in plain text files,
like `turns water into steam` or `becomes fire when touching lava (20%)`.
The engine is already built: it runs the world, lets you paint, shares
worlds as links, and checks your rules for mistakes. **No programming needed.**

**See it working first:** [play with the sample sandbox](https://emenriquez.github.io/cs1101-falling-sand/).

> **Start here.** Read this page top to bottom once. It takes five minutes.

---

## 1. Set up your team's copy (Day 1)

### One person: the owner

Pick one teammate to own the repository. Everyone else will work in it too.

1. Near the top of this page, click **Use this template** → **Create a new repository**.
2. Name it `falling-sand`, set it to **Public**, and click **Create repository**.
3. **Turn on the live link.** In the new repository: **Settings** → **Pages** →
   under **Branch** choose `main` and `/ (root)` → **Save**. About a minute
   later, the sandbox is live at `https://OWNER-USERNAME.github.io/falling-sand/`.
4. **Invite your teammates.** **Settings** → **Collaborators** →
   **Add people** → type a teammate's GitHub username → **Add**. Repeat for
   each teammate. (GitHub may ask for your password first.)

### Everyone else

1. Open `https://github.com/OWNER-USERNAME/falling-sand/invitations` (use the
   owner's username) and click **Accept invitation**. The same invitation is
   also in your email.
2. Bookmark the team's repository and the live link.

---

## 2. Ways to split the work

Everything your team writes lives in the `elements` folder:

| File | What it is |
| --- | --- |
| `elements/list.txt` | the sandbox's title and theme, and which element files to load |
| `elements/basics.txt` | the starter elements: sand, water, fire, lava and friends |
| `elements/YOUR-NAME.txt` | your own elements (you'll make this file on Day 1) |

**Each person owns one element file**, named after them, like
`elements/sam.txt`. Nobody edits anyone else's file, so your changes don't
collide. Only `list.txt` is shared: everyone adds one line to it.

These are suggestions. Split the work however suits your team:

- **2 people:** each of you invents a *family* of elements, and every
  element in your family has to react with at least one of your
  teammate's. (Your goo eats their crystals; their crystals turn your goo to stone.)
- **3 people:** the same, plus one person takes charge of `basics.txt`:
  tuning the starter elements so they play well with everyone's new ones.
- **4 people:** pair up. Each pair builds one big chain reaction together,
  and the two chains have to meet in the middle.

**Your first change (everyone, Day 1):** make your own element file with one
element in it, add it to `list.txt`, and get it merged with a pull request.
The steps are in the next section.

---

## 3. How to change things: a pull request

On a team, nobody changes `main` directly. `main` is what the live link
shows, so it's the version everyone shares. Instead you **propose** a change,
a teammate **reviews** it, and then it's **merged** into `main`. That's a
**pull request**, and almost every software team in the world works this way.

### Making your own element file (Day 1)

1. In your repository, open the `elements` folder, then click **Add file** →
   **Create new file**.
2. Name it after yourself, all lowercase, ending in `.txt`: for example `sam.txt`.
3. Copy this in, and change the name and the rules however you like:

   ```text
   by: Sam

   ## goo
   color: limegreen, #6fdc4a
   moves: flows
   turns sand into goo (2%)
   ```

4. Click **Commit changes...**. Choose **Create a new branch for this commit
   and start a pull request**, then **Propose changes**, then
   **Create pull request**.
5. The **Sand check** will turn red: *"elements/sam.txt isn't in list.txt, so
   the sandbox never loads it."* That's expected. Fix it on the same branch:
   near the top of your pull request, click your **branch's name** (the blue
   label, like `sam-patch-1`). Open `elements` → `list.txt` → the **pencil**.
   Add a line with your file's name, `sam.txt`, at the bottom. Click
   **Commit changes...** and choose **Commit directly to the `sam-patch-1`
   branch**.
6. Back on your pull request, the check runs again and turns green. Ask a
   teammate to review it.

### Changing a file that already exists

1. Open the file (for example `elements/sam.txt`) and click the **pencil**
   icon (*Edit this file*).
2. Make your change.
3. **Test it first** (recommended): select everything in the editor
   (<kbd>Ctrl</kbd>+<kbd>A</kbd>, or <kbd>⌘</kbd>+<kbd>A</kbd> on a Mac), copy
   it, then open your team's live link and click **Test a draft**. See section 5.
4. Back in GitHub, click **Commit changes...**. Write a message that says
   what you changed, like `Make goo spread more slowly`.
5. Choose **Create a new branch for this commit and start a pull request**,
   then click **Propose changes**.
6. On the next page, fill in the description and click **Create pull request**.
7. Wait about 30 seconds for the **Sand check** at the bottom of the page.
   - ✓ green: the check found nothing wrong. Ask a teammate to review.
   - ✗ red: click **Details** to see what to fix. To fix it, go to the
     **Files changed** tab, click the **⋯** menu on your file → **Edit file**,
     and commit again. Your fix goes into the same pull request.

### Reviewing a teammate's pull request

1. Open the **Pull requests** tab and click their pull request.
2. Click **Files changed** and read every line. Green lines were added; red
   lines were removed.
3. **Try it.** On the file's **⋯** menu, click **View file**, then the
   **Copy raw file** button. Paste it into **Test a draft** on the live link,
   and paint with every new element.
4. Click **Review changes** (or **Submit review**). Choose:
   - **Approve** if it's ready, or
   - **Request changes** if something is wrong, with a comment that says
     exactly what and where, so your teammate can fix it.
5. Once it's approved, open the **Conversation** tab and click
   **Merge pull request** → **Confirm merge**. The live link updates about a
   minute later.

Don't merge your own pull request until a teammate has approved it.

---

## 4. Element cheat sheet

```text
by: Sam                          at the top of the file: who made these elements

## goo                           a new element: ## and a name (lowercase
                                 letters, numbers and dashes, no spaces)
color: limegreen, #6fdc4a        one or more colors: a name, or a # code
moves: flows                     stays    stays where you put it (like stone)
                                 falls    falls and piles up (like sand)
                                 flows    falls and spreads out (like water)
                                 rises    floats upward (like smoke)
weight: 2                        heavier things sink through lighter ones
lasts: 60                        disappears after 60 frames (about 1 second)
lasts: 20-90                     ...or a random time in that range
then becomes: smoke              turns into smoke when its time runs out

becomes fire when touching lava (20%)     changes ITSELF
turns sand into goo (2%)                  changes what it TOUCHES
turns empty into smoke (5%)               "empty" means blank space
```

- **The % is the chance it happens each frame.** The sandbox runs about 60
  frames a second, so even 2% happens fast. Leave the % off for 100%:
  every single frame. Decimals like `(0.5%)` work for slow things.
- **Weight** decides who sinks. If you leave it out, things that fall weigh
  3, things that flow weigh 2, and things that rise weigh 1. Oil in the
  sample weighs 1, so water (2) sinks under it and oil floats on top.
- **Rules can mention any element in any file**, including your teammates'.
  That's how your elements react with theirs.
- **Colors:** any [web color name](https://developer.mozilla.org/en-US/docs/Web/CSS/named-color)
  (like `tomato`, `gold`, `skyblue`), or a # code from a color picker (search
  "color picker" and copy the code that starts with #). Two or three shades
  of one color make it look grainy and real.
- Elements show up in the palette in the order of `list.txt`, then the order
  inside each file. The first nine get number keys.
- Lines between `<!--` and `-->` are notes. The sandbox never reads them.

`list.txt` looks like this:

```text
title: The Sandbox               the name at the top of the page
theme: night                     night, day, space, or paper

basics.txt                       the element files to load, one per line
sam.txt
```

---

## 5. Tools on the live site

| Tool | Does |
| --- | --- |
| **Palette** | pick what to paint. Hover over (or tap) an element to read its rules in plain English, and which file and line they come from. |
| **Pause** / **Step** | stop the world, then move it forward one frame at a time, so you can see exactly what each rule does |
| **Clear** | empty the world (with an **Undo**, just in case) |
| **Speed** | slow motion, normal, fast, very fast |
| **Brush** | small, medium or large |
| **Share this world** | a link that rebuilds this exact world for anyone who opens it |
| **Test a draft** | paste an element file you're still writing and paint with it, without committing anything |
| **✓ No problems** / **⚠ problems** | lists every mistake the engine found, with the file, the line, and how to fix it |

Keys: <kbd>Space</kbd> pause, <kbd>N</kbd> one step, <kbd>1</kbd>–<kbd>9</kbd>
pick an element, <kbd>E</kbd> eraser, <kbd>B</kbd> brush size. Under the
sandbox, the status line tells you what's under the pointer and how many
of each element there are.

---

## 6. When something goes wrong

- The **problems** button turns red when a file has a mistake. It tells you
  the file, the line, and the usual fix. A line with a mistake is skipped, and
  the rest still works. Fix the first problem, then test again.
- The **Sand check** on every pull request runs the same checks, plus one more:
  every element file has to be in `list.txt`. Mistakes get caught before they
  reach `main`.
- An element doesn't do what you expected? **Pause**, then **Step** one frame
  at a time and watch. Hover over it in the palette to read what the engine
  thinks its rules are.
- A merged pull request broke something? Open it and click **Revert**. That
  makes a new pull request that undoes it.

### "This branch has conflicts that must be resolved"

Two pull requests changed the same lines, and GitHub can't tell which one
you want. In this project that's usually `list.txt`, when two people each
add their file at the bottom.

1. Click **Resolve conflicts**. GitHub shows both versions between markers:

   ```text
   <<<<<<< sam-patch-1
   sam.txt
   =======
   jo.txt
   >>>>>>> main
   ```

2. Edit the text so it says what you actually want. Usually that's **keep
   both**: here, one line `sam.txt` and one line `jo.txt`.
3. Delete the three marker lines (`<<<<<<<`, `=======`, `>>>>>>>`).
4. Click **Mark as resolved** → **Commit merge**. The Sand check runs again.

---

## More

- [CHALLENGES.md](CHALLENGES.md): Day 1 first steps, and the "Make it yours" challenges.
- [docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md): how the simulation works, and why the share links are so short.
- [docs/IDEAS.md](docs/IDEAS.md): **optional** bigger features, if your team wants to go further.
- Found something that doesn't work right? **Issues** → **New issue** → **Bug report**.
