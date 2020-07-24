let canvas = document.getElementById('gameOfLifeCanvas');
resizeCanvas();
let ctx = canvas.getContext('2d');

function resizeCanvas() {
    let parent_rect = canvas.parentNode.getBoundingClientRect();
    canvas.height = parent_rect.height;
    canvas.width = parent_rect.width;
}

world_size = [250,250];
let gameMatrix;
let colorsMatrix;
let selectMatrix;
clearWorld()
function clearWorld() {
    gameMatrix = Array(world_size[0]).fill(0).map(item =>(new Array(world_size[1]).fill(0)));
    colorsMatrix = Array(world_size[0]).fill(0).map(item=>(new Array(world_size[1]).fill(0)).map(item=>Array(3).fill(0)));
    clearSelect();
}

function clearSelect() {
    selectMatrix = Array(world_size[0]).fill(0).map(item =>(new Array(world_size[1]).fill(0)));
}

//--------------------Game Customisation-------------------------------------------------
let lifespan = false;
let cell_lifespan = 10; //each cell lives only for 10 generations

let gridline_width = 1;
let cell_size_perc = 0.85; //max is 1. if max, it occupies all of the grid cell it's in
let select_size_perc = 0.95;


let colorful = false;
let default_cell_color = [255,255,255];
let paint_color = [255,255,255];
let bg_color = 'rgb(0,0,0)';
let gridline_color = '#ffffff10';
let select_alpha = 0.3;
let select_yes_color = 'rgb(118,255,3'+select_alpha+')';
let select_no_color = 'rgb(244,67,54'+select_alpha+')';

let zoom_slider_exp = 2;    //has to be greater or equal to 1

let speed_cap_max = 30; //the maximum value that the speed can reach, regardless of html speed slider max.
let speed_cap_min = 0.01;

let defaultGameSpeed = 5; //2 generation passes every second
let defaultZoom = 100;  //zoom in to see a 100*100 cells space. unit = percentage
let zoom_cap_min = 1;   //zoom in cap when zooming closer than one cell.
let zoom_cap_max = 400;

//---------------------Game Brains-------------------------------------------------------
function nextGeneration() {
    let nextGen = JSON.parse(JSON.stringify(gameMatrix));
    let nextColorMat = JSON.parse(JSON.stringify(colorsMatrix));
    let ones_zeros = [-1,0,1];

    for (let row=0;row<gameMatrix.length;row++) {
        for (let col=0;col<gameMatrix[0].length;col++) {
            let neighbor_count = 0;

            let cell_color;
            if (colorful) {
                cell_color = colorsMatrix[row][col];
                cell_color = cell_color.map(x => Math.pow(x,2));
            }else {
                cell_color = default_cell_color;
            }
            ones_zeros.forEach(i => {
                ones_zeros.forEach(j => {
                    if ((row+i>=0)&&(col+j>=0)&&(row+i<gameMatrix.length)&&(col+j<gameMatrix[0].length) && !(i==0 && j==0) && (gameMatrix[row+i][col+j]!=0)) {
                        neighbor_count = neighbor_count + 1;
                        if (colorful) {
                            let neighbor_color = colorsMatrix[row+i][col+j];
                            cell_color[0] = cell_color[0]+Math.pow(neighbor_color[0],2);
                            cell_color[1] = cell_color[1]+Math.pow(neighbor_color[1],2);
                            cell_color[2] = cell_color[2]+Math.pow(neighbor_color[2],2);
                        }
                    }
                })
            });

            if (colorful) {
                cell_color = cell_color.map(x => Math.pow(x/(neighbor_count+1),0.5));
                let max_color_val = Math.max(...cell_color);
                cell_color = cell_color.map(x => (x/max_color_val)*255);
            }

            let cell_state = gameMatrix[row][col];
            if (cell_state==0) {
                if (neighbor_count==0) {continue}
                if(neighbor_count==3) {
                    nextGen[row][col] = 1;
                }
            }else {
                if ((neighbor_count<2)||(neighbor_count>3)||(cell_state>cell_lifespan)*(lifespan)) {
                    nextGen[row][col] = 0;
                }else {
                    nextGen[row][col] = cell_state + (1*lifespan);
                }
            }
            nextColorMat[row][col] = cell_color;
        }
    }
    gameMatrix = JSON.parse(JSON.stringify(nextGen));
    colorsMatrix = JSON.parse(JSON.stringify(nextColorMat));
}

//----------------------Setting Defaults-------------------------------
for (let i=0;i<gameMatrix[0].length;i++) {
    gameMatrix[i][i] = 1;
    gameMatrix[i][world_size[1]-1-i] = 1;
    colorsMatrix[i][i] = default_cell_color;
    colorsMatrix[i][world_size[1]-1-i] = default_cell_color;
}

let gameRect = {
    x: 0,
    y: 0,
    width: canvas.width*(1/calcZoomRatio(defaultZoom)), //100% zoom means the game width is equal to the canvas width
    height: (gameMatrix.length/gameMatrix[0].length)*canvas.width*(1/calcZoomRatio(defaultZoom)) //  game height/game width equals gameMatrix height/gameMatrix width
}
panToCenter();  //pan the view to the center cells of the game matrix

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
document.getElementById("gameZoomSlider").value = inverseExpInc(defaultZoom,minZoom,maxZoom,zoom_slider_exp);

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

//------------------------------------Game Speed------------------------------------------
function gameSpeed() {
    return parseFloat(document.getElementById("gameSpeedSlider").value);
}

function speedSliderPoint(value) {
    return value
}

//----------------------Zooming Game----------------------------------------------------
function zoom_unit() {
    return expIncrement(maxZoom-parseFloat(document.getElementById("gameZoomSlider").value),minZoom,maxZoom,zoom_slider_exp);
}
function zoom(z_unit) {
    let zoom_ratio = calcZoomRatio(z_unit)
    let new_width = canvas.width*(1/zoom_ratio);
    let new_height = (gameMatrix.length/gameMatrix[0].length)*new_width;

    let zoom_pivot_vector = [(canvas.width/2)-gameRect.x,(canvas.height/2)-gameRect.y]; //pivots center of canvas to top left of gameRect
    let scale_pivot_factor = [new_width/gameRect.width,new_height/gameRect.height];
    zoom_pivot_vector[0] = zoom_pivot_vector[0]*scale_pivot_factor[0];
    zoom_pivot_vector[1] = zoom_pivot_vector[1]*scale_pivot_factor[1]

    gameRect.x = (canvas.width/2)-zoom_pivot_vector[0];
    gameRect.y = (canvas.height/2)-zoom_pivot_vector[1];
    gameRect.height = new_height;
    gameRect.width = new_width;
}

//-----------------------------Hand Controls--------------------------------------------
let touching;

let pan_pivot_vector;
let panning;
let painting;
let erasing;
stopHand();
function stopHand() {
    panning = false;
    painting = false;
    erasing = false;
    touching = false;
}

function startTouching() {touching=true;}

canvas.ontouchstart = startTouching;
canvas.ontouchend =stopHand;
canvas.ontouchcancel = stopHand;
canvas.onmouseup = stopHand;
canvas.onmouseleave = stopHand;

canvas.onmousedown = startHand;
function startHand(event) {
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

            if (painting) {
                paintCell(x_coord,y_coord);
            }else if (erasing) {
                eraseCell(x_coord,y_coord);
            }
        }
        
        let coords = touchPoint2CanvasCoords(event,touches[0]); //set touch coordinate in case you are panning
        x_coord = coords[0];
        y_coord = coords[1];
    }else {
        let coords = mousePoint2CanvasCoords(event);
        x_coord = coords[0];
        y_coord = coords[1];

        if (painting) {
            paintCell(x_coord,y_coord);
        }else if (erasing) {
            eraseCell(x_coord,y_coord);
        }
    }

    if (panning) {
        panGame(x_coord,y_coord);
    }
}

//----------------------Panning Game----------------------------------------------------
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

//----------------------------Painting Cells-------------------------------------
function paintCell(x_coord,y_coord) {
    let mat_view = gameMatViewCoords();
    let gameRect2matScale = [gameMatrix[0].length/gameRect.width,gameMatrix.length/gameRect.height];
    let col = Math.floor((gameRect2matScale[0]*x_coord)+mat_view[0][0]);
    let row = Math.floor((gameRect2matScale[1]*y_coord)+mat_view[0][1]);
    if (row>gameMatrix.length-1) {
        row=gameMatrix.length-1;
    }else if (row<0) {
        row = 0;
    }
    if (col>gameMatrix[0].length-1) {
        col=gameMatrix[0].length-1;
    }else if (col<0) {
        col = 0;
    }
    if (gameMatrix[row][col]==0) {
        gameMatrix[row][col]=1;
        colorsMatrix[row][col]=paint_color;
    }
}

//---------------------------------Erasing Cells---------------------------
function eraseCell(x_coord,y_coord) {
    let mat_view = gameMatViewCoords();
    let gameRect2matScale = [gameMatrix[0].length/gameRect.width,gameMatrix.length/gameRect.height];
    let col = Math.floor((gameRect2matScale[0]*x_coord)+mat_view[0][0]);
    let row = Math.floor((gameRect2matScale[1]*y_coord)+mat_view[0][1]);
    if (row>gameMatrix.length-1) {
        row=gameMatrix.length-1;
    }else if (row<0) {
        row = 0;
    }
    if (col>gameMatrix[0].length-1) {
        col=gameMatrix[0].length-1;
    }else if (col<0) {
        col = 0;
    }
    if (gameMatrix[row][col]!=0) {
        gameMatrix[row][col]=0;
        colorsMatrix[row][col]=[0,0,0];
    }
}
    

//---------------------------Game Controls------------------------------
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

//---------------------------Game Loop----------------------------------
let fps = 60;
draw(); //display the starting frame

let last_draw_time = Date.now();
gameLoop();
function gameLoop() {
    if (run_once) {
        run_once = false; run_repeat = false;
        nextGeneration();
        last_draw_time = Date.now();
    }else if (run_repeat) {
        let game_speed = gameSpeed();
        let current_time = Date.now();
        let elapsed = current_time-last_draw_time;
        
        if (elapsed >= (1000/game_speed)) {
            last_draw_time = current_time;
            nextGeneration();
        }
    }
    draw();
    setTimeout(function() {
        requestAnimationFrame(gameLoop);
      }, 1000/fps);
}

//-----------------------------------Drawing----------------------------------------------------
function draw() {
    zoom(zoom_unit());
    let game_view_range = gameMatViewCoords();

    ctx.fillStyle = bg_color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(game_view_range);
    drawCellsAndSelect(game_view_range);
}

function drawGrid(game_view_range) {
    ctx.save();
    ctx.lineWidth = gridline_width;
    ctx.strokeStyle = gridline_color;

    let game_view_start = game_view_range[0];
    let game_view_end = game_view_range[1];

    let mat2canvasScale = [gameRect.width/gameMatrix[0].length,gameRect.height/gameMatrix.length];
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

    let mat2canvasScale = [gameRect.width/gameMatrix[0].length,gameRect.height/gameMatrix.length];
    let grid_cell_size = [mat2canvasScale[0]*1,mat2canvasScale[1]*1];
    let cell_size = [grid_cell_size[0]*cell_size_perc,grid_cell_size[1]*cell_size_perc];   //how much of one grid cell does a cell occupy
    let rounded_radius = 0.1*cell_size[0];

    let select_size = [grid_cell_size[0]*select_size_perc,grid_cell_size[1]*select_size_perc];
    
    for(let row=game_view_start[1];row<game_view_end[1];row++) {
        for(let col=game_view_start[0];col<game_view_end[0];col++) {
            row = Math.floor(row);
            col = Math.floor(col);
            if (row>gameMatrix.length || col>gameMatrix[0].length) {
                continue
            }
            if (gameMatrix[row][col]!=0) {
                let x_coord = gameRect.x+(col*mat2canvasScale[0])+((grid_cell_size[0]-cell_size[0])/2);
                let y_coord = gameRect.y+(row*mat2canvasScale[1])+((grid_cell_size[1]-cell_size[1])/2);
                ctx.beginPath();
                let color = colorsMatrix[row][col];
                ctx.fillStyle = 'rgb('+color[0]+','+color[1]+','+color[2]+')';
                roundedRectangle(x_coord, y_coord,cell_size[0],cell_size[1],rounded_radius);
                ctx.fill();
            }
        }
    }

    ctx.restore();
}

//---------------------------Minor Function----------------------------------------------
function gameMatViewCoords() {
    let canvas2matScale = [gameMatrix[0].length/gameRect.width,gameMatrix.length/gameRect.height];
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

    if (end_coords[0]>gameMatrix[0].length) {
        end_coords[0] = gameMatrix[0].length;
    }
    if (end_coords[1]>gameMatrix.length) {
        end_coords[1] = gameMatrix.length;
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

function getRandomColor() {return Array.from([0, 0, 0], x => (Math.random() * 255))}

function rainbow() {
    colorful = true;
    for (let row=0;row<gameMatrix.length;row++) {
        for (let col=0;col<gameMatrix[0].length;col++) {
            if (gameMatrix[row][col]!=0) {
                let color = getRandomColor();
                color = color.map(x => (x/Math.max(...color))*255);
                colorsMatrix[row][col] = color;
            }
        }
    }
}

function expIncrement(inputVal,minv,maxv,exp) {
    if (inputVal<minv) {
        inputVal = minv;
    }else if(inputVal>maxv) {
        inputVal = maxv;
    }
    let outputVal = ((maxv-minv)*Math.pow(((inputVal-minv)/(maxv-minv)),exp))+minv;
    
    return outputVal
}

function inverseExpInc(outputVal,minv,maxv,exp) {
    if (outputVal<minv) {
        outputVal = minv;
    }else if(outputVal>maxv) {
        outputVal = maxv;
    }
    let inputVal = (Math.pow((outputVal-minv)/(minv-maxv),1/exp)*(maxv-minv))+minv;
    
    return inputVal
}

function calcZoomRatio(matSize) {
    return (matSize/gameMatrix.length)
}

function roundedRectangle(x, y, width, height, rounded) {
    const radiansInCircle = 2 * Math.PI
    const halfRadians = (2 * Math.PI)/2
    const quarterRadians = (2 * Math.PI)/4  
    
    // top left arc
    ctx.arc(rounded + x, rounded + y, rounded, -quarterRadians, halfRadians, true)
    
    // line from top left to bottom left
    ctx.lineTo(x, y + height - rounded)
  
    // bottom left arc  
    ctx.arc(rounded + x, height - rounded + y, rounded, halfRadians, quarterRadians, true)  
    
    // line from bottom left to bottom right
    ctx.lineTo(x + width - rounded, y + height)
  
    // bottom right arc
    ctx.arc(x + width - rounded, y + height - rounded, rounded, quarterRadians, 0, true)  
    
    // line from bottom right to top right
    ctx.lineTo(x + width, y + rounded)  
  
    // top right arc
    ctx.arc(x + width - rounded, y + rounded, rounded, 0, -quarterRadians, true)  
    
    // line from top right to top left
    ctx.lineTo(x + rounded, y)  
}
