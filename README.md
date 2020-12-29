# Game-of-life-Conway
This is an implementation of the zero-player game "Conway's game of life," built with some additional features to make it more interractive.
The core game is built simply on the following 4 rules:
1. Any live cell with fewer than two live neighbours dies, as if by underpopulation.
2. Any live cell with two or three live neighbours lives on to the next generation.
3. Any live cell with more than three live neighbours dies, as if by overpopulation.
4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.

# Preset patterns
Some famous patterns discovered by others who have studied the game, are built into the game and can be placed anywhere on the playground. A few others which I discovered to be interesting are also included. These paterns can also be rotated using the rotate button, allowing the user to place these patterns in any orientation they desire.

![Preset Patterns](https://user-images.githubusercontent.com/47716543/103318343-2c5fe380-49fc-11eb-9171-9a47513d7524.gif)

# Running the game
The game can be run using the "Run" button, or the "Step" button can be used to step through a single "generation" of the simulation. Changes to the playground can be made while the game is running, by maybe adding a preset pattern. The playground can be cleared at any point in time.

![Running the game](https://user-images.githubusercontent.com/47716543/103318610-fb33e300-49fc-11eb-84c6-5fed08f3b201.gif)

# Controls
The user can pan around to see other areas of the playground by dragging the screen. There is a slider which controls the zoom level, allowing you to see more of the playground, as well as another which controls the speed at which the game runs. 

![Alt Text](https://media.giphy.com/media/vFKqnCdLPNOKc/giphy.gif)

# Painting
The user can make their own patterns using the "paint" and "erase" features. There is also a "rainbow" button which assigns each live cell a color. On every iteration, a cell's color changes to a color which is the average of its color and that of its immediate neighboring cells. There is a 1 in 1000 chance that a cell's color does not change to the average after an iteration, but rather, takes on a new, random color.

![Alt Text](https://media.giphy.com/media/vFKqnCdLPNOKc/giphy.gif)
