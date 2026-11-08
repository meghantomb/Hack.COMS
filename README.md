# What the Duck?
### By Katelyn Clark, Meghan Tomback, Alexandra Jean
### For Hack.COMS 2026 

## Inspiration
What happens when a freshly escaped piece of bread finds itself in a pond full of eligible ducks? Apparently, a dating sim where you may or may not get eaten. _What the Duck?_  started as the first joke idea thrown out .. and unfortunately was brought to creation. Inspired by games like _Date Everything!_ and _Doki Doki Literature Club!_, WTD lets you play as a delicious piece of bread while you build relationships with the four local ducks, each with their own special personality. In _Episode - Choose Your Story_ fashion, the best dialogue options are locked behind ~~a paywall~~ eight unique minigames. Will you romance your way to freedom and companionship? Or end up as a snack for some hungry ducks?

## What it does
Talk your way through branching conversations with four dateable ducks while managing love meters that decide whether you earn friendship, romance, or just the privilege of being lunch. Better dialogue options unlock by beating eight minigames: four signature games tied to each duck (Pixel Paint, Bullet Hell, Bread Snake, and Slide Puzzle) plus a random pool (Simon Quacks, Flappy Duck, Rhythm Quacker, and Duckling Dash).

## How we built it
A TypeScript monorepo with a React + Vite + Tailwind client, an Express API, and a shared package for dialogue types, friendliness rules, and minigame metadata. Game state and story are stored on Tiger Data with Postgres, with an in-memory fallback. Minigames are wired through a registry so each duck route can restrict choices behind their win conditions. Optional Grok (xAI) support can batch-generate additional dialogue offline without live gameplay having to depend on the model. 

## Challenges we ran into
The tech stack wiring was pretty complicated, and all three of us navigating different parts of the codebase at the same time led to a lot of merge conflicts and minor crash outs. Getting the frontend, backend, and database to cooperate was its own minigame, except nobody was having fun and there was no choice to lose. We also had to figure out how to fit eight minigames, four branching storylines, and a concerning amount of duck lore into 25 hours.

## Accomplishments that we're proud of
We actually followed through on the joke :'). We're also really proud of all the very human aspects of the project, like the hand-drawn characters, backgrounds, and bad animations, as well as the character writing (each duck has their own backstory, habits, etc.) and story flow. Somehow, our incredibly unserious idea turned into an actual playable game with four ducks that we are now emotionally attached to .. some more than others (I <3 Ryan).

## What we learned
This was our first time working with Grok bots, so we learned a lot about setting up separate character-specific bots and giving them enough context to generate dialogue that actually fits each duck's personality. Most importantly, we learned that making a dating simulator is significantly harder when you also have to worry about the player getting eaten.

## What's next for What the Duck?
More dialogue, more endings, more minigames, and potentially more questionable romantic interests. We'd love to expand the storylines, add more character interactions, polish the art and animations, and make the relationship system even more chaotic. Maybe even give our poor piece of bread a chance at a happier ending. Or not. The ducks are pretty hungry.