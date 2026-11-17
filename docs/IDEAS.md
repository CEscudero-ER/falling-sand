# Going further (optional)

Everything here is **optional**. The project can be completed in full
without anything on this page, and without using AI at all.

These ideas are for teams that want more. Some need nothing new. Others need
changes to the engine, which is where an AI assistant can help, as long as
**you stay in charge of checking its work**.

---

## No new skills needed

- **A puzzle level.** Build a world, share the link, and write a goal in
  your `Project plan` issue: "Get the water to the plant without touching
  the lava." Swap puzzles with another team.
- **A gallery.** Collect your best share links in the issue, each with a
  one-line caption, like a museum wall.
- **Rain and seasons.** Steam turns back into water when its time runs
  out. Can you make a whole weather cycle: snow that melts in sunlight that
  makes steam that becomes rain?
- **A different theme.** Try `theme: day` or `theme: space` in `list.txt`.
  Some colors look great on one and disappear on another.

---

## With an AI assistant

### Rules for working with AI on code

1. **Work on a branch.** Every change goes through a pull request anyway, so
   nothing reaches `main` until a teammate has reviewed it.
2. **Give it context.** It hasn't seen this project. Tell it this is a
   browser falling-sand game in plain JavaScript with no libraries; that
   element files are read and checked in `engine/elements.js`, simulated in
   `engine/world.js`, and shown in `engine/app.js`; and paste in the files
   it needs to see.
3. **Ask it to explain before you accept.** "Before you change anything, tell
   me which files you'll change and why." If you can't follow the
   explanation, ask again until you can.
4. **New rule words need checking too.** If the feature adds something new
   to element files (like `explodes when touching …`), the checker in
   `engine/elements.js` has to learn it as well. Otherwise the problems
   button and the Sand check will call every one of those lines a mistake.
   Ask the AI to update both, and to add a helpful message for typos.
5. **Test it yourself.** Use the "Check it" list for each idea. A teammate
   who didn't build it should test it too.
6. **Say so in the pull request**, like `Add explosions (AI-assisted)`, and
   write one thing the AI got wrong the first time and how you caught it.

You're responsible for every line in your repository, whoever typed it.

### Ideas

**Wind** · *easier.* A button (or the arrow keys) that blows everything that
`rises` to the left or right.
Check it: smoke drifts the way the wind blows; sand and stone don't care;
turning the wind off makes everything go back to normal.

**Gravity switch** · *easier.* A button that flips the world upside down:
falling things fall up, rising things sink.
Check it: sand piles up on the ceiling; flipping twice gets you back to
normal; share links still work.

**Explosions** · *medium.* A new rule, `explodes when touching fire`, that
clears a circle of cells around the element and fills some of them with fire.
Check it: the size of the hole makes sense; explosions can set off other
explosives (chain reaction!); a typo like `explode when touching fire` gets a
clear message in the problems list.

**Temperature** · *harder.* Every cell gets a temperature. Fire and lava are
hot, ice is cold, and heat spreads to neighbors a little each frame. New
rules like `melts into water above 30`.
Check it: ice melts faster next to lava than next to warm water; a big block
of ice cools the water around it; the hover description explains the new
rules in plain English.

**Sound** · *medium.* Quiet crackles when fire burns, a hiss when lava
touches water. Use the browser's built-in Web Audio, not sound files.
Check it: there's a mute button; a huge fire doesn't play hundreds of sounds
at once (it should stay pleasant); nothing plays until someone clicks.

**Saved worlds** · *medium.* A "Save" button that keeps the current world in
this browser (`localStorage`), with a small picture of each, and a gallery
to open them again.
Check it: worlds survive closing the tab; deleting one works; a saved world
made before someone added a new element still opens.
