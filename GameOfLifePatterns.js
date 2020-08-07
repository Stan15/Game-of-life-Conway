
let gosperGliderGun = {
    name: 'Gosper\'s glider gun',
    space_needed: [9,36],
    start_pattern: [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0],
                    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0],
                    [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],
    selected:false,
    y_coord: 0,
}

let glider = {
    name: 'Glider',
    space_needed: [7,7],
    start_pattern: [[1,0,0],
                    [0,1,1],
                    [1,1,0]],
    selected:false,
    y_coord: 0,
}

let lightweight_spaceship = {
    name: 'Lightweight spaceship',
        space_needed: [6,7],
        start_pattern: [[1,0,0,1,0],
                        [0,0,0,0,1],
                        [1,0,0,0,1],
                        [0,1,1,1,1]],
        selected:false,
        y_coord: 0,
}

let eater = {
    name: 'Eater',
    space_needed: [4,4],
    start_pattern: [[1,1,0,0],
                    [1,0,1,0],
                    [0,0,1,0],
                    [0,0,1,1]],
    selected:false,
    y_coord: 0,
}

let small_explosion = {
    name: 'small explosion',
    space_needed: [4,3],
    start_pattern: [[0,1,0],
                    [1,1,1],
                    [1,0,1],
                    [0,1,0]],
    selected:false,
    y_coord: 0,
}

let x_pattern_mat = Array(11).fill(0).map(item =>(new Array(11).fill(0)));
for (let i=0;i<x_pattern_mat.length;i++) {
    x_pattern_mat[i][i] = 1;
    x_pattern_mat[i][x_pattern_mat[0].length-1-i] = 1;
}
let x_pattern = {
    name: 'X-shaped',
    space_needed: [11,11],
    start_pattern: x_pattern_mat,
    selected: false,
    y_coord: 0,
}

var GameOfLifePresetPatterns = [gosperGliderGun,glider,lightweight_spaceship,eater,small_explosion,x_pattern];