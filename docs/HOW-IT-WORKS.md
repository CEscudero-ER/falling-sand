# How it works

You don't need to read this to do the project. It's here for when you
wonder *why* the sandbox does what it does.

## The files

```text
index.html                 the page: the sandbox, the palette, the buttons
elements/list.txt          YOU: the title, the theme, which element files to load
elements/*.txt             YOU: the elements and their rules
engine/elements.js         reads your element files and checks them for mistakes
engine/world.js            the simulation: the grid, the rules, the share links
engine/app.js              the page: painting, buttons, the draft tester, problems
engine/style.css           how it looks, including the four themes
engine/check-cli.js        the Sand check that GitHub runs on every pull request
.github/workflows/check.yml  tells GitHub when to run the Sand check
```

## The world is a grid

The sandbox is a grid of **200 × 150 = 30,000 cells**. Each cell holds
exactly one thing: an element, or `empty`. On the screen, each cell is one
square "pixel", blown up so you can see it.

The computer doesn't store the word "sand" 30,000 times. When the page loads,
it numbers the elements in palette order (empty is 0, sand is 1, water is
2, …) and each cell just stores a number. That's how a computer stores
almost anything: numbers that mean something only because the program
agrees on what they mean.

## One frame

About 60 times a second, the engine runs one **frame**. In one frame, it
visits every cell that isn't empty, and that cell does three things, in
this order:

1. **Runs out?** If the element has `lasts:`, its timer goes down by one.
   At zero, it disappears, or turns into its `then becomes:` element.
2. **Reacts?** It checks its `becomes … when touching …` rules: is one of
   its eight neighbors the right element? Then it rolls the dice, using
   the %. Then it applies its `turns … into …` rules to its neighbors, the
   same way.
3. **Moves?** Something that `falls` tries to move down, then diagonally
   down. Something that `flows` does that and then slides sideways. Something
   that `rises` does the same thing upside down. It can move into empty
   space, or swap with something lighter (going down) or heavier (going up).

That's it. There's no rule anywhere that says "make a waterfall" or "build
a volcano." Those things *emerge* from thousands of tiny cells each
following a few local rules. Scientists use the same idea, called a
**cellular automaton**, to model forest fires, traffic jams, snowflakes and
the spread of diseases.

## Why the order matters

The engine visits the cells from the **bottom row up**. Imagine it went top
down instead: a grain of sand at the top moves down one row… then the engine
reaches that row and moves the same grain again… and again. It would fall
all the way to the floor in one frame. Going bottom up, plus a mark that
says "already moved this frame", makes everything move one step per frame.

It also switches between scanning left-to-right and right-to-left, row by
row. Without that, sand piles would lean one way, because grains on one side
would always get to move first. Try to spot that kind of bias in other
programs: the order a computer does things in can change the result.

## Randomness

`(20%)` means: each frame, roll a 100-sided die, and if it's 20 or under,
it happens. That's why fire spreads in a different shape every time. Small
chances add up fast: at 60 frames a second, a 2% chance happens a little
more than once a second, on average.

Liquids and powders also flip a coin to decide whether to try left or right
first. Take the randomness out and the world looks mechanical, like a machine
instead of nature.

## Why the share link is so short

The world has 30,000 cells. Writing out every one would make a link of
30,000 characters or more. Instead, the link counts **runs**: "4,212 empty,
then 18 sand, then 3 water, then 196 empty…". A big empty sky, or a solid
block of stone, is a single run, so it takes up almost no room.

That trick is called **run-length encoding**. It's one of the oldest ways to
make data smaller: fax machines use it, and the PNG, GIF and ZIP formats use
cleverer cousins of the same idea (find the repetition, and describe it
instead of writing it all out). It works great on
worlds with big areas of the same thing, and badly on noisy, speckled
worlds. Try it: share an empty world, then a very messy one, and compare
the links.

The link also lists the **names** of the elements it uses, not their
numbers. That way, if your team adds a new element and every number
shifts, old links still work.

## The Sand check

When you open a pull request, GitHub starts a fresh computer, copies your
repository onto it, and runs `engine/check-cli.js`, the same checks the
problems button runs, plus a check that every element file is in
`list.txt`. A red ✗ blocks nothing by itself, but it tells your reviewer
something is wrong *before* it reaches the live link. Running automatic
checks on every change is called **continuous integration**, and real
software teams do it on every single change.

## Connections to the rest of the course

- **Data representation:** each cell is a number; each color is three
  numbers (red, green, blue), written in hex in your files (`#e2c290`).
- **Algorithms:** one frame is an algorithm: a fixed list of steps,
  repeated for every cell, 60 times a second.
- **Compression:** run-length encoding in the share links.
- **Simulation and models:** simple rules, complicated results.
