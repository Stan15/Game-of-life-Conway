//----------------Preset Patterns-------------------
const pattern_draw_height = 100;
const patternsBoxPadding = 10;
const pattern_name_height = 20;

let presetPatterns = _.cloneDeep(GameOfLifePresetPatterns);

let current_y_coord = 0;
for (let i=0;i<presetPatterns.length;i++) {
    presetPatterns[i].y_coord = current_y_coord;
    current_y_coord = current_y_coord + (patternsBoxPadding+pattern_name_height+patternsBoxPadding+pattern_draw_height+patternsBoxPadding);
}

//------------------------------------------------
const canvas = document.getElementById('gameOfLifeCanvas');
const ctx = canvas.getContext('2d');
resizeCanvas();

function resizeCanvas() {
    let parent_rect = canvas.parentNode.getBoundingClientRect();
    canvas.height = parent_rect.height;
    canvas.width = parent_rect.width;
}

const presetsCanvas = document.getElementById('presetPatternCanvas');
const presetsCtx = presetsCanvas.getContext('2d');

resizePresetsCanvas()
function resizePresetsCanvas() {
    let parent_rect = presetsCanvas.parentNode.getBoundingClientRect();
    presetsCanvas.width = parent_rect.width-25;
    presetsCanvas.height = presetPatterns.length*(patternsBoxPadding+pattern_name_height+patternsBoxPadding+pattern_draw_height+patternsBoxPadding);
}

const pattern_draw_width = presetsCanvas.width-(2*patternsBoxPadding);

//----------------------Default Variables--------------------------------
//gameplay
const world_size = [350,350];
let cell_states;
let colorsMatrix;

let lifespan = false;
let cell_lifespan = 1; //each cell lives only for 1 generations

const default_cell_color = [255,255,255];
let colorful;
let paint_color = default_cell_color;

//initialising empty state
clearWorld()
function clearWorld() {
    colorful = false;
    cell_states = Array(world_size[0]).fill(0).map(item =>(new Array(world_size[1]).fill('000'))); //in the '000', first 0 is cell state 'dead', second is neighbor count, and third is if the cell is currently selected
    colorsMatrix = Array(cell_states.length).fill(0).map(item=>(new Array(cell_states[0].length).fill(0)).map(item=>[0,0,0]));
}

//game objects
const gridline_width = 1;
const cell_size_perc = 0.90;
const select_size_perc = 0.95;
const cell_rounded = 0.1;

const bg_color = 'rgba(0,0,0,1)';
const gridline_color = '#ffffff00';
const select_alpha = .3;
const canPlace_color = 'rgba(0,255,0,'+select_alpha+')';  //color of hover if you can place a pattern in an area
const noPlace_color = 'rgba(255,0,0,'+select_alpha+')';

const presetSelectColor = 'rgba(150,150,255,0.5)';

//game controls
const defaultGameSpeed = 10; //10 generations every second
const speed_cap_min = .01;
const speed_cap_max = 120; //the maximum value that the speed can reach, regardless of html speed slider max.

const defaultZoom = 50; //see an area of 100 cells across
const zoom_cap_min = 1;
const zoom_cap_max = cell_states[0].length; //maximum zoom is when you can see the whole width of the game

//--------------------------Setting Defaults------------------
for (let i=0;i<cell_states[0].length;i++) {
    makeCellAlive(i,i);
    makeCellAlive(i,world_size[1]-1-i);
    colorsMatrix[i][i] = default_cell_color;
    colorsMatrix[i][world_size[1]-1-i] = default_cell_color;
}

let gameRect = {
    x: 0,
    y: 0,
    width: canvas.width*(1/calcZoomRatio(defaultZoom)), //100% zoom means the game width is equal to the canvas width
    height: (cell_states.length/cell_states[0].length)*canvas.width*(1/calcZoomRatio(defaultZoom)) //  game height/game width equals cell_states height/cell_states width
}
panToCenter();  //pan the view to the center cells of the game matrix

//preset patterns window
let selectingPattern = {
    patternSelected: false, //do we have a pattern selected?
    pattern: undefined, //the pattern that is selected
    canPlacePattern: false, //do we have enough space around the current mouse position to place the pattern?
};

//zoom
let minZoom = parseFloat(document.getElementById("gameZoomSlider").min);
let maxZoom = parseFloat(document.getElementById("gameZoomSlider").max);
if (maxZoom>zoom_cap_max) {
    maxZoom = zoom_cap_max;
    document.getElementById("gameZoomSlider").max = zoom_cap_max;
}
if (minZoom<zoom_cap_min) {
    minZoom = zoom_cap_min;
    document.getElementById("gameZoomSlider").min = zoom_cap_min;
}
document.getElementById("gameZoomSlider").value = maxZoom-inverseExpDec(defaultZoom,minZoom,maxZoom);

//game speed
let minGameSpeed = parseFloat(document.getElementById("gameSpeedSlider").min);
let maxGameSpeed = parseFloat(document.getElementById("gameSpeedSlider").max);

if (maxGameSpeed>speed_cap_max) {
    maxGameSpeed = speed_cap_max;
    document.getElementById("gameSpeedSlider").max = speed_cap_max;
}
if (minGameSpeed<speed_cap_min) {
    minGameSpeed = speed_cap_min;
    document.getElementById("gameSpeedSlider").min = speed_cap_min;
}
document.getElementById("gameSpeedSlider").value = speedSliderPoint(defaultGameSpeed);

//------------------Game Speed slider Logarithmic Control---------------------
//currently no logarithmic game speed slider control
function gameSpeed() {
    return expDecrement(parseFloat(document.getElementById("gameSpeedSlider").value),minGameSpeed,maxGameSpeed);
}

function speedSliderPoint(value) {
    return inverseExpDec(value,minGameSpeed,maxGameSpeed)
}

//-----------------------Zooming Game---------------------
function zoom() {   //zoom based on value of zoom slider
    let z_unit = expDecrement(maxZoom-parseFloat(document.getElementById("gameZoomSlider").value),minZoom,maxZoom);//for zooming by smaller increments as we zoom in closer
    let zoom_ratio = calcZoomRatio(z_unit)
    let new_width = canvas.width*(1/zoom_ratio);
    let new_height = (cell_states.length/cell_states[0].length)*new_width;

    let zoom_pivot_vector = [(canvas.width/2)-gameRect.x,(canvas.height/2)-gameRect.y]; //pivots center of canvas to top left of gameRect
    let scale_pivot_factor = [new_width/gameRect.width,new_height/gameRect.height];
    zoom_pivot_vector[0] = zoom_pivot_vector[0]*scale_pivot_factor[0];
    zoom_pivot_vector[1] = zoom_pivot_vector[1]*scale_pivot_factor[1]

    gameRect.x = (canvas.width/2)-zoom_pivot_vector[0];
    gameRect.y = (canvas.height/2)-zoom_pivot_vector[1];
    gameRect.height = new_height;
    gameRect.width = new_width;
}


//------------------Game Brain-----------------------
function nextGeneration() {
    let nextGen = _.cloneDeep(cell_states);

    ones_zeros = [-1,0,1];
    for (let row=0;row<cell_states.length;row++) {
        for (let col=0;col<cell_states[0].length;col++) {
            let state = cell_states[row][col];
            let alive = state[0];
            let nbor_count = state[1];

            if (alive=='1' && ['2','3'].includes(nbor_count)) {
                if (colorful && nbor_count!='0') {computeColor(row,col);}
                continue
            }
            if (alive=='0' && nbor_count!='3') {continue}

            let cell_born = false;
            let cell_dies = false;
            if (alive=='0') {
                cell_born = true;
                nextGen[row][col] = '1'+nextGen[row][col][1]+nextGen[row][col][2];
            }else {
                cell_dies = true;
                nextGen[row][col] = '0'+nextGen[row][col][1]+nextGen[row][col][2];
            }

            for (let i=0;i<3;i++) {
                for (let j=0;j<3;j++) {
                    let row_offset = ones_zeros[i];
                    let col_offset = ones_zeros[j];
                    nIdx = [row+row_offset,col+col_offset];   //index of neighboring cell
                    if (nIdx[0]<0 || nIdx[1]<0 || nIdx[0]>=cell_states.length || nIdx[1]>=cell_states[0].length) {continue}
                    nbor_state = nextGen[nIdx[0]][nIdx[1]];
                    if (!(row_offset==0 && col_offset==0)) {    //if this is actually a neighboring cell and not the original cell
                        if (cell_born) {
                            nextGen[nIdx[0]][nIdx[1]] = nbor_state[0]+(parseInt(nbor_state[1])+1)+nbor_state[2];
                        }else {
                            nextGen[nIdx[0]][nIdx[1]] = nbor_state[0]+(parseInt(nbor_state[1])-1)+nbor_state[2];
                        }
                    }
                }
            }

            if (colorful && cell_born && nextGen[row][col][1]!='0') {
                computeColor(row,col);
            }
        }
    }
    cell_states = nextGen;
}

function computeColor(row,col) {
    let color = [0,0,0];
    let neighbor_count = 0;
    for (let i=0;i<3;i++) {
        for (let j=0;j<3;j++) {
            let nRow = row+ones_zeros[i];
            let nCol = col+ones_zeros[j];
            if (nRow<0 || nCol<0 || nRow>=cell_states.length || nCol>=cell_states[0].length) {continue}
            if (cell_states[nRow][nCol][0]!='1') {continue}
            let nbor_colr = colorsMatrix[nRow][nCol];
            color = color.map((colr,idx) => {
                return colr+Math.pow(nbor_colr[idx],2);
            });
            neighbor_count = neighbor_count + 1;
        }
    }
    color = color.map(x => Math.pow(x/(neighbor_count),0.5));
    color = color.map(x => (x/Math.max(...color))*255);

    let chances = [...new Array(999).fill(0),1];
    let num = chances[Math.floor(Math.random() * chances.length)];

    if (num==1) {
        color = getRandomColor();
        color = color.map(x => (x/Math.max(...color))*255);
    }
    
    colorsMatrix[row][col] = color;
}

//Rotate Preset Patterns
function rotatePatterns() {
    for (let i=0;i<presetPatterns.length;i++) {
        presetPatterns[i].space_needed = presetPatterns[i].space_needed.reverse();
        presetPatterns[i].start_pattern = rotateLeft(presetPatterns[i].start_pattern);
    }
}


//-------------------------Hand Controls-----------------------
let touching;

let panning;
let painting;
let erasing;

let pan_pivot_vector;

stopHand();
function stopHand() {
    panning = false;
    painting = false;
    erasing = false;
    touching = false;
}

function startTouching() {touching = true;}

canvas.ontouchstart = startTouching;
canvas.ontouchend =stopHand;
canvas.ontouchcancel = stopHand;
canvas.onmouseup = stopHand;
canvas.onmouseleave = stopHand;

canvas.onclick = placePattern;

canvas.onmousedown = startHand;
function startHand() {
    let hand_control = document.querySelector('input[name="hand"]:checked').value;
    if (hand_control == "pan") {
        panning = true;
        setPanPivot(event);
    }else if (hand_control == "paint") {
        painting = true;
    }else if (hand_control == "erase") {
        erasing = true;
    }
    performHandControl(event);
}

canvas.onmousemove = performHandControl;
canvas.ontouchmove = performHandControl;

function performHandControl(event) {
    if (touching) {
        event.preventDefault();
    }

    let x_coord;
    let y_coord;
    if (touching) {
        let touches = event.touches;
        for (touch of touches) {
            let coords = touchPoint2CanvasCoords(event,touch);
            x_coord = coords[0];
            y_coord = coords[1];
            let row, col;
            [row,col] = canvasCoords2matIdx(x_coord,y_coord);
            if (selectingPattern.patternSelected) {
                selectAnimation(row,col);
                break
            }else if (painting) {
                paintCell(row,col);
            }else if (erasing) {
                eraseCell(row,col);
            }
        }
        
        let coords = touchPoint2CanvasCoords(event,touches[0]); //set touch coordinate in case you are panning
        x_coord = coords[0];
        y_coord = coords[1];
    }else {
        let coords = mousePoint2CanvasCoords(event);
        x_coord = coords[0];
        y_coord = coords[1];
        let row, col;
        [row,col] = canvasCoords2matIdx(x_coord,y_coord);

        if (selectingPattern.patternSelected) {
            selectAnimation(row,col);
        }else if (painting) {
            paintCell(row,col);
        }else if (erasing) {
            eraseCell(row,col);
        }
    }

    if (panning) {
        panGame(x_coord,y_coord);
    }
}

//preset patterns canvas
presetsCanvas.addEventListener('click',function() {
    [x_coord,y_coord] = mousePoint2CanvasCoords(event);
    for (let i=0;i<presetPatterns.length;i++) {
        let pattern = presetPatterns[i];
        
        let patternIsClicked = false;
        let patternAlreadySelected = false;
        if (y_coord>=pattern.y_coord+patternsBoxPadding && y_coord<=pattern.y_coord+patternsBoxPadding+pattern_name_height+patternsBoxPadding+pattern_draw_height) {
            patternIsClicked = true;
            if (pattern.selected) {
                patternAlreadySelected = true;
            }
        }

        if (patternIsClicked) {
            if (patternAlreadySelected) {
                selectingPattern.patternSelected = false;
                presetPatterns[i].selected = false;
                selectingPattern.pattern = undefined;
            }else {
                for (let j=0;j<presetPatterns.length;j++) {
                    presetPatterns[j].selected = false;
                }
                presetPatterns[i].selected = true;
                selectingPattern.patternSelected = true;
                selectingPattern.pattern = presetPatterns[i];
            }
            break
        }
    }
});

//-------------------Panning game
function setPanPivot(event) {
    if (touching) {
        let coords = touchPoint2CanvasCoords(event,event.touches[0]);
        x_coord = coords[0];
        y_coord = coords[1];
    }else {
        let coords = mousePoint2CanvasCoords(event);
        x_coord = coords[0];
        y_coord = coords[1];
    }
    pan_pivot_vector = [x_coord - gameRect.x,y_coord - gameRect.y]; //top left of game matrix pivots with the cursor
}

function panGame(x_coord,y_coord) {
    let gameRectPos = [gameRect.x,gameRect.y];
    let mousePos = [x_coord,y_coord];
    let offset = [mousePos[0]-pan_pivot_vector[0],mousePos[1]-pan_pivot_vector[1]];

    //keeping offset in range
    let offsetRangeX = [0,canvas.width-gameRect.width];
    let offsetRangeY = [0,canvas.height-gameRect.height];
    let offsetRanges = [offsetRangeX.sort(),offsetRangeY.sort()];
    offset.forEach(function(item,index){
        if (item<offsetRanges[index][0]+1) {
            this[index] = offsetRanges[index][0];
            pan_pivot_vector[index] = mousePos[index]-gameRectPos[index]  //adjusting the pivot vector values as the gameRect didn,t move as expected according to the previous pivot values
        }else if (item>offsetRanges[index][1]-1) {
            this[index] = offsetRanges[index][1];
            pan_pivot_vector[index] = mousePos[index]-gameRectPos[index];
        }
    },offset);

    //setting offset
    gameRect.x = offset[0];
    gameRect.y = offset[1];
}

function panToCenter() {
    gameRect.x = (canvas.width-gameRect.width)/2;
    gameRect.y = (canvas.height-gameRect.height)/2;
}

//----------------------Painting Cells-------------------
function paintCell(row,col) {
    if (row>=cell_states.length) {
        row = cell_states.length-1;
    }else if (row<0) {
        row = 0;
    }
    
    if (col>=cell_states[0].length) {
        col=cell_states[0].length-1;
    }else if (col<0) {
        col = 0;
    }

    if (cell_states[row][col][0]=='0') {
        makeCellAlive(row,col);
        colorsMatrix[row][col] = paint_color;
    }
}

//-------------------------Erasing Cells----------------
function eraseCell(row,col) {
    if (row>=cell_states.length) {
        row = cell_states.length-1;
    }else if (row<0) {
        row = 0;
    }
    
    if (col>=cell_states[0].length) {
        col=cell_states[0].length-1;
    }else if (col<0) {
        col = 0;
    }

    if (cell_states[row][col][0]!='0') {
        makeCellDead(row,col);
        colorsMatrix[row][col] = [0,0,0];
    }
}

//--------------Placing Pattern--------------------------
function placePattern(event) {
    if (!selectingPattern.patternSelected) {return}
    let row;
    let col;

    let event_type = event.type;
    if (event_type=='touchmove') {
        let coords = touchPoint2CanvasCoords(event,event.touches[0]);
        x_coord = coords[0];
        y_coord = coords[1];
    }else if (event.type=='mousemove' || event_type=='click') {
        let coords = mousePoint2CanvasCoords(event);
        x_coord = coords[0];
        y_coord = coords[1];
    }else {return}
    [row,col] = canvasCoords2matIdx(x_coord,y_coord);
    selectAnimation(row,col);

    if (!selectingPattern.canPlacePattern){return}

    let pattern = selectingPattern.pattern.start_pattern;
    let patternSize = [pattern.length,pattern[0].length];
    let startIdx = [Math.floor(row-((patternSize[0]-1)/2)),Math.floor(col-((patternSize[1]-1)/2))];

    //adjusting neighbor count
    for (let row=0;row<patternSize[0];row++) {
        for (let col=0;col<patternSize[1];col++) {
            if (pattern[row][col]==1) {
                let idx = [startIdx[0]+row,startIdx[1]+col]
                makeCellAlive(idx[0],idx[1]);
                colorsMatrix[idx[0]][idx[1]]=paint_color;
            }
        }
    }
}

function selectAnimation(row,col) {
    cell_states = cell_states.map(row =>(row.map(col =>(col.slice(0,2)+'0'))));   //for all states 'xyz' in cell_states, set z=0

    let space_needed = selectingPattern.pattern.space_needed;
    let startIdx = [Math.floor(row-((space_needed[0]-1)/2)),Math.floor(col-((space_needed[1]-1)/2))];
    let endIdx = [Math.floor(row+((space_needed[0]-1)/2)),Math.floor(col+((space_needed[1]-1)/2))];

    canPlace = true;
    for (let i=startIdx[0];i<=endIdx[0];i++) {
        for (let j=startIdx[1];j<=endIdx[1];j++) {
            if (i<0 || j<0 || i>=cell_states.length || j>=cell_states[0].length) {
                canPlace = false;
            }else {
                cell_states[i][j] = cell_states[i][j].slice(0,2)+'1';
                if (cell_states[i][j][0]!='0') {
                    canPlace = false;
                }
            }
        }
    }
    selectingPattern.canPlacePattern = canPlace;
}

//------------------------Running Game------------------------
let run_once = false;
let run_repeat = false;
function gameStep() {
    run_once = true;
    run_repeat = false
    document.getElementById('runGame').innerHTML = 'Run';
}
function gameRun() {
    run_repeat = !run_repeat;
    if (run_repeat) {
        document.getElementById('runGame').innerHTML = 'Stop';
    }else {
        document.getElementById('runGame').innerHTML = 'Run';
    }
}

//---------------------------Game Loop-------------------------
let fps = 60;
draw(); //display the starting frame

let last_draw_time = Date.now();
gameLoop();
function gameLoop() {
    if (run_once) {
        run_once = false;run_repeat = false;
        nextGeneration();
        last_draw_time = Date.now();
    }else if (run_repeat) {
        let game_speed = gameSpeed();
        let current_time = Date.now();
        let elapsed = current_time-last_draw_time;

        if (elapsed>=(1000/game_speed)) {
            last_draw_time = current_time;
            nextGeneration();
        }
    }
    draw();
    setTimeout(function() {
        requestAnimationFrame(gameLoop);
      }, 1000/fps);
    
}


//---------------------------Drawing------------------------
function draw() {
    zoom();
    let game_view_range = gameMatViewCoords();

    //background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = bg_color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid(game_view_range);
    drawCellsAndSelect(game_view_range);
    drawPresetPatterns()
}

function drawGrid(game_view_range) {
    ctx.save();
    ctx.lineWidth = gridline_width;
    ctx.strokeStyle = gridline_color;

    let game_view_start = game_view_range[0];
    let game_view_end = game_view_range[1];

    let mat2canvasScale = [gameRect.width/cell_states[0].length,gameRect.height/cell_states.length];
    for (let i=game_view_start[0];i<game_view_end[0];i++) {
        i = Math.floor(i);
        let x_coord = gameRect.x+(i*mat2canvasScale[0]);
        ctx.beginPath();
        ctx.moveTo(x_coord, gameRect.y+(game_view_start[1]*mat2canvasScale[1]));
        ctx.lineTo(x_coord, gameRect.y+(game_view_end[1]*mat2canvasScale[1]));
        ctx.stroke();
    }
    for (let i=game_view_start[1];i<game_view_end[1];i++) {
        i = Math.floor(i);
        let y_coord = gameRect.y+(i*mat2canvasScale[1]);
        ctx.beginPath();
        ctx.moveTo(gameRect.x+(game_view_start[0]*mat2canvasScale[0]), y_coord);
        ctx.lineTo(gameRect.x+(game_view_end[0]*mat2canvasScale[0]), y_coord);
        ctx.stroke();
    }
    ctx.restore();
}

function drawCellsAndSelect(game_view_range) {
    ctx.save();
    let game_view_start = game_view_range[0];
    let game_view_end = game_view_range[1];

    let mat2canvasScale = [gameRect.width/cell_states[0].length,gameRect.height/cell_states.length];
    let grid_cell_size = [mat2canvasScale[0]*1,mat2canvasScale[1]*1];
    let cell_size = [grid_cell_size[0]*cell_size_perc,grid_cell_size[1]*cell_size_perc];   //how much of one grid cell does a cell occupy
    let select_cell_size = [grid_cell_size[0]*select_size_perc,grid_cell_size[1]*select_size_perc];
    let rounded_radius = cell_rounded*cell_size[0];

    for(let row=game_view_start[1];row<game_view_end[1];row++) {
        for(let col=game_view_start[0];col<game_view_end[0];col++) {
            row = Math.floor(row);
            col = Math.floor(col);
            if (row>=cell_states.length || col>=cell_states[0].length) {
                continue
            }
            if (cell_states[row][col][0]!='0') {
                let x_coord = gameRect.x+(col*mat2canvasScale[0])+((grid_cell_size[0]-cell_size[0])/2);
                let y_coord = gameRect.y+(row*mat2canvasScale[1])+((grid_cell_size[1]-cell_size[1])/2);

                let color
                if (colorful) {
                    color = colorsMatrix[row][col];
                }else {
                    color = default_cell_color;
                }
                ctx.fillStyle = 'rgb('+color[0]+','+color[1]+','+color[2]+')';
                if (cell_rounded==0) {
                    ctx.fillRect(x_coord, y_coord,cell_size[0],cell_size[1]);
                }else {
                    ctx.beginPath();
                    roundedRectangle(ctx,x_coord, y_coord,cell_size[0],cell_size[1],rounded_radius);
                    ctx.fill();
                }
            }
            if (selectingPattern.patternSelected) {
                if (cell_states[row][col][2]!='0') {
                    let x_coord = gameRect.x+(col*mat2canvasScale[0])+((grid_cell_size[0]-select_cell_size[0])/2);
                    let y_coord = gameRect.y+(row*mat2canvasScale[1])+((grid_cell_size[1]-select_cell_size[1])/2);

                    if (selectingPattern.canPlacePattern) {
                        ctx.fillStyle = canPlace_color;
                    }else {
                        ctx.fillStyle = noPlace_color;
                    }
                    ctx.beginPath();
                    roundedRectangle(ctx,x_coord, y_coord,select_cell_size[0],select_cell_size[1],rounded_radius);
                    ctx.fill();
                }
            }
        }
    }
    ctx.restore();
}

function drawPresetPatterns() {
    presetsCtx.save();
    presetsCtx.fillStyle = bg_color;
    presetsCtx.clearRect(0, 0, presetsCanvas.width, presetsCanvas.clientHeight)
    presetsCtx.fillRect(0, 0, presetsCanvas.width, presetsCanvas.clientHeight);

    for (let i=0;i<presetPatterns.length;i++) {
        let pattern = presetPatterns[i];
        let current_y = pattern.y_coord + patternsBoxPadding;

        presetsCtx.font = "15px Arial";
        presetsCtx.fillStyle = 'white';
        presetsCtx.textBaseline = 'top';
        presetsCtx.fillText(pattern.name, 5, current_y);
        current_y = current_y + pattern_name_height + patternsBoxPadding;

        let start_pattern = pattern.start_pattern;

        let mat2canvasScale = pattern_draw_height/start_pattern.length;
        let x_offset = patternsBoxPadding;
        let y_offset = pattern.y_coord + (2*patternsBoxPadding) + pattern_name_height;

        if (start_pattern.length>start_pattern[0].length) {
            mat2canvasScale = pattern_draw_height/start_pattern.length;
            if ((start_pattern[0].length*mat2canvasScale)>pattern_draw_width) {
                mat2canvasScale = pattern_draw_width/start_pattern[0].length;
            }
        }else if (start_pattern.length<start_pattern[0].length) {
            mat2canvasScale = pattern_draw_width/start_pattern[0].length;
            if ((start_pattern.length*mat2canvasScale)>pattern_draw_height) {
                mat2canvasScale = pattern_draw_height/start_pattern.length;
            }
        }
        x_offset = x_offset+(pattern_draw_width-(mat2canvasScale*start_pattern[0].length))/2;
        y_offset = y_offset+(pattern_draw_height-(mat2canvasScale*start_pattern.length))/2;
        
        let grid_cell_size = mat2canvasScale*1;
        let cell_size = cell_size_perc*grid_cell_size;
        let rounded_radius = 0.1*cell_size;

        for (let row=0;row<start_pattern.length;row++) {
            for (let col=0;col<start_pattern[0].length;col++) {
                if(start_pattern[row][col]!=0) {
                    let x_coord = x_offset+(col*mat2canvasScale);
                    let y_coord = y_offset+(row*mat2canvasScale);

                    presetsCtx.beginPath();
                    presetsCtx.fillStyle = 'rgb('+default_cell_color[0]+','+default_cell_color[1]+','+default_cell_color[2]+')';
                    roundedRectangle(presetsCtx,x_coord, y_coord,cell_size,cell_size,rounded_radius);
                    presetsCtx.fill();
                }
            }
        }

        
        if (pattern.selected) {
            presetsCtx.beginPath();
            presetsCtx.fillStyle = 'rgba(0,0,0,0.3)';
            roundedRectangle(presetsCtx,patternsBoxPadding,pattern.y_coord + (2*patternsBoxPadding) + pattern_name_height,pattern_draw_width,pattern_draw_height,0.01*(pattern_draw_width));
            presetsCtx.fill()
            presetsCtx.fillStyle = presetSelectColor;
            roundedRectangle(presetsCtx,patternsBoxPadding,pattern.y_coord + (2*patternsBoxPadding) + pattern_name_height,pattern_draw_width,pattern_draw_height,0.01*(pattern_draw_width));
            presetsCtx.fill();
        }

        current_y = current_y + pattern_draw_height + patternsBoxPadding;
    }
    presetsCtx.restore();
}


//----------------------Minor Functions-------------------------
function gameMatViewCoords() {  //returns the start and end indices defining the all the cells that the player is currently viewing on the canvas. purpose: for optimising speed, only drawing visible elements to screen.
    let canvas2matScale = [cell_states[0].length/gameRect.width,cell_states.length/gameRect.height];
    let start_coords = [];
    let end_coords = [];

    if (gameRect.width<=canvas.width) {
        start_coords[0] = 0;
        end_coords[0] = gameRect.width*canvas2matScale[0];
    }else {
        start_coords[0] = Math.abs(gameRect.x)*canvas2matScale[0];
        end_coords[0] = start_coords[0]+(canvas.width*canvas2matScale[0]);
    }
    if (gameRect.height<=canvas.height) {
        start_coords[1] = 0;
        end_coords[1] = gameRect.height*canvas2matScale[1];
    }else {
        start_coords[1] = Math.abs(gameRect.y)*canvas2matScale[1];
        end_coords[1] = start_coords[1]+(canvas.height*canvas2matScale[1]);
    }

    if (end_coords[0]>cell_states[0].length) {
        end_coords[0] = cell_states[0].length;
    }
    if (end_coords[1]>cell_states.length) {
        end_coords[1] = cell_states.length;
    }

    return [start_coords,end_coords]
}

function touchPoint2CanvasCoords(event,event_point) {
    let rect = event.target.getBoundingClientRect();
    let x_coord = event_point.pageX - rect.left;
    let y_coord = event_point.pageY - rect.top;

    return [x_coord,y_coord]
}
function mousePoint2CanvasCoords(event) {
    let rect = event.target.getBoundingClientRect();
    let x_coord = event.pageX - rect.left;
    let y_coord = event.pageY - rect.top;

    return [x_coord,y_coord]
}

function canvasCoords2matIdx(x_coord,y_coord) {
    let mat_view = gameMatViewCoords();
    let canvas2matScale = [cell_states[0].length/gameRect.width,cell_states.length/gameRect.height];
    let col = Math.floor((canvas2matScale[0]*x_coord)+mat_view[0][0]);
    let row = Math.floor((canvas2matScale[1]*y_coord)+mat_view[0][1]);

    return [row,col]
}

function getRandomColor() {return Array.from([0, 0, 0], x => (Math.random() * 255))}

function rainbow() {
    colorful = !colorful;
    if (colorful) {
        for (let row=0;row<cell_states.length;row++) {
            for (let col=0;col<cell_states[0].length;col++) {
                if (cell_states[row][col][0]!=0) {
                    let color = getRandomColor();
                    color = color.map(x => (x/Math.max(...color))*255);
                    colorsMatrix[row][col] = color;
                }
            }
        }
    }
    draw()
}

function expDecrement(inputVal,minv,maxv) {
    let exp = 2;
    if (inputVal<minv) {
        inputVal = minv;
    }else if(inputVal>maxv) {
        inputVal = maxv;
    }
    let outputVal = ((maxv-minv)*Math.pow(((inputVal-minv)/(maxv-minv)),exp))+minv;
    
    return outputVal
}

function inverseExpDec(outputVal,minv,maxv) {
    let exp = 2;
    if (outputVal<minv) {
        outputVal = minv;
    }else if(outputVal>maxv) {
        outputVal = maxv;
    }
    let inputVal = ((maxv-minv)*Math.pow((outputVal-minv)/(maxv-minv),1/exp))+minv;
    
    return inputVal
}

function calcZoomRatio(matSize) {
    return (matSize/cell_states.length)
}

function roundedRectangle(context,x, y, width, height, rounded) {
    const radiansInCircle = 2 * Math.PI
    const halfRadians = (2 * Math.PI)/2
    const quarterRadians = (2 * Math.PI)/4  
    
    context.arc(rounded + x, rounded + y, rounded, -quarterRadians, halfRadians, true)  // top left arc
    context.lineTo(x, y + height - rounded)  // line from top left to bottom left
    context.arc(rounded + x, height - rounded + y, rounded, halfRadians, quarterRadians, true)  // bottom left arc  
    context.lineTo(x + width - rounded, y + height)  // line from bottom left to bottom right
    context.arc(x + width - rounded, y + height - rounded, rounded, quarterRadians, 0, true)  // bottom right arc
    context.lineTo(x + width, y + rounded)  // line from bottom right to top right
    context.arc(x + width - rounded, y + rounded, rounded, 0, -quarterRadians, true)  // top right arc
    context.lineTo(x + rounded, y)  // line from top right to top left
}

function makeCellAlive(row,col) {
    ones_zeros = [-1,0,1];
    let state = cell_states[row][col];
    let alive = state[0];
    if (alive=='1') {return}

    cell_states[row][col] = '1'+cell_states[row][col][1]+cell_states[row][col][2];

    for (let i=0;i<3;i++) {
        for (let j=0;j<3;j++) {
            let row_offset = ones_zeros[i];
            let col_offset = ones_zeros[j];
            nIdx = [row+row_offset,col+col_offset];   //index of neighboring cell
            if (nIdx[0]<0 || nIdx[1]<0 || nIdx[0]>=cell_states.length || nIdx[1]>=cell_states[0].length) {continue}
            nbor_state = cell_states[nIdx[0]][nIdx[1]];
            if (!(row_offset==0 && col_offset==0)) {    //if this is actually a neighboring cell and not the original cell
                cell_states[nIdx[0]][nIdx[1]] = nbor_state[0]+(parseInt(nbor_state[1])+1)+nbor_state[2];
            }
        }
    }
}

function makeCellDead(row,col) {
    ones_zeros = [-1,0,1];
    let state = cell_states[row][col];
    let alive = state[0];
    if (alive=='0') {return}

    cell_states[row][col] = '0'+cell_states[row][col][1]+cell_states[row][col][2];

    for (let i=0;i<3;i++) {
        for (let j=0;j<3;j++) {
            let row_offset = ones_zeros[i];
            let col_offset = ones_zeros[j];
            nIdx = [row+row_offset,col+col_offset];   //index of neighboring cell
            if (nIdx[0]<0 || nIdx[1]<0 || nIdx[0]>=cell_states.length || nIdx[1]>=cell_states[0].length) {continue}
            nbor_state = cell_states[nIdx[0]][nIdx[1]];
            if (!(row_offset==0 && col_offset==0)) {    //if this is actually a neighboring cell and not the original cell
                cell_states[nIdx[0]][nIdx[1]] = nbor_state[0]+(parseInt(nbor_state[1])-1)+nbor_state[2];
            }
        }
    }
}

let lastCalledTime;

function rotateLeft(array) {
    var result = [];
    array.forEach(function (a, i, aa) {
        a.forEach(function (b, j, bb) {
            result[j] = result[j] || [];
            result[j][aa.length - i - 1] = b;
        });
    });
    return result;
}
