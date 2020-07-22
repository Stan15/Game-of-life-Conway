let arraySize = 500
let gameMatrix = Array.from(Array(arraySize), _ => Array(arraySize).fill(0));
for (let i=0;i<gameMatrix.length;i++) {
    gameMatrix[i][i] = 1;
    gameMatrix[i][gameMatrix[0].length-1-i] = 1;
}

let canvas = document.getElementById('gameOfLifeCanvas');
let ctx = canvas.getContext('2d');

let zoom_percent = (100/gameMatrix.length)*100;
if (zoom_percent > 100) {
    zoom_percent = 100;
}
let gameRect = {
    x: 0,
    y: 0,
    height: 0,
    width: 0,
}
zoom(zoom_percent);    //set gameRect height and width
centerView();          //set the x and y coordinates of the gameRect to be centered with the canvas
let gridline_width = 5;

var dragging = false;
canvas.addEventListener('mousedown', function(event) {
    pivotVector = {
        x: event.pageX - gameRect.x,
        y: event.pageY - gameRect.y
    }
    dragging = true;
});
canvas.addEventListener('mouseup',() => {dragging = false;});

canvas.addEventListener('mousemove', function(event) {
    canvas_rect = event.target.getBoundingClientRect();
    if (event.pageX<=canvas_rect.left || event.pageX>=canvas_rect.right || event.pageY<=canvas_rect.top || event.pageY>=canvas_rect.bottom) {
        drag = false;
    }
    if (dragging) {
        let offsetRangeX = [0,canvas.width-gameRect.width];
        let offsetRangeY = [0,canvas.height-gameRect.height];
        let offsetRanges = [offsetRangeX.sort(),offsetRangeY.sort()];

        let offset = [event.pageX-pivotVector.x,event.pageY-pivotVector.y];
        
        offset.forEach(function(item,index){
            if (item<offsetRanges[index][0]) {
                this[index] = offsetRanges[index][0];
            }else if (item>offsetRanges[index][1]) {
                this[index] = offsetRanges[index][1];
            }
        },offset);
        gameRect.x = offset[0];
        gameRect.y = offset[1];
    }

})


let gameSpeed = 0.2;    //1 cycle every 0.5 seconds
let timeThen = Date.now();
let fps = 60;
let mspf = 1000/fps;
let run_once = false;
let run_repeat = true;
gameLoop()
function gameLoop() {
    if (run_once) {
        run_once = false;
        run_repeat = false;
        let slow = true;
        gameAnimate(slow);
        draw();
    }else if (run_repeat) {
        let slow = false;
        timeNow = Date.now();
        elapsed = timeNow - timeThen;
        if (elapsed >= (gameSpeed*1000)) {
            timeThen = timeNow - (elapsed % (gameSpeed*1000));
            gameAnimate(slow);
        }
        draw();
    }else if (dragging) {
        draw();
    }
    setTimeout(function() {
        requestAnimationFrame(gameLoop);
      }, mspf);
}

function gameAnimate(slow) {
    let newGameMatrix = JSON.parse(JSON.stringify(gameMatrix));
    let ones_zeros = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];   //cartesian product of [-1,0,1] and itself, but without [0,0].
    for (let row=0;row<gameMatrix.length;row++) {
        for (let col=0;col<gameMatrix[0].length;col++) {
            neighbor_count = 0
            ones_zeros.forEach(element => {
                nRow = row + element[0];
                nCol = col + element[1];
                if (nRow<0 || nCol<0 || nRow>gameMatrix.length-1 || nCol>gameMatrix[0].length-1) {
                    return
                }
                neighbor_count = neighbor_count + gameMatrix[nRow][nCol];
            })
            
            if (gameMatrix[row][col]==0 && neighbor_count==3) {
                newGameMatrix[row][col]=1;
            }else if(gameMatrix[row][col]==1 && ((neighbor_count<2)||(neighbor_count>3))) {
                newGameMatrix[row][col]=0;
            }
        }
    }
    gameMatrix = JSON.parse(JSON.stringify(newGameMatrix));
}

function draw() {
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid(gridline_width,'rgb(50,50,50)');
    drawCells('white',0.85);
}

function drawGrid(line_width,grid_color) {
    ctx.save();
    ctx.strokeStyle = grid_color;

    scale = [gameRect.width/gameMatrix[0].length,gameRect.height/gameMatrix.length];
    for (let i=0;i<gameMatrix.length;i++) {
        ctx.beginPath();
        ctx.moveTo((i*scale[0])+gameRect.x,gameRect.y);
        ctx.lineTo((i*scale[0])+gameRect.x,gameRect.y+gameRect.height);
        ctx.stroke();
    }
    for (let i=0;i<gameMatrix[0].length;i++) {
        ctx.beginPath();
        ctx.moveTo(gameRect.x,gameRect.y+(i*scale[1]));
        ctx.lineTo(gameRect.x+gameRect.width,gameRect.y+(i*scale[1]));
        ctx.stroke();
    }
    ctx.restore();
}

function drawCells(cell_color,sizePercent) {
    ctx.save();
    ctx.fillStyle = cell_color;

    scale = [gameRect.width/gameMatrix[0].length,gameRect.height/gameMatrix.length];

    let grid_cell_size = [scale[0]*1,scale[1]*1];
    let cell_size = [grid_cell_size[0]*sizePercent,grid_cell_size[1]*sizePercent];   //how much of one grid cell does a cell occupy
    let rounded_radius = 0.1*cell_size[0];
    for(let row=0;row<gameMatrix.length;row++) {
        for(let col=0;col<gameMatrix[0].length;col++) {
            if (gameMatrix[row][col] != 0) {
                let pointX = gameRect.x+((col*scale[0])+((grid_cell_size[0]-cell_size[0])/2));
                let pointY = gameRect.y+((row*scale[1])+((grid_cell_size[1]-cell_size[1])/2));
                ctx.save();
                ctx.beginPath();
                roundedRectangle(pointX,pointY,cell_size[0],cell_size[1],rounded_radius);
                ctx.fill();
            }
        }
    }
    ctx.restore();
}

function centerView() {  //center the view of the gameMatrix
    gameRect.x = (canvas.width-gameRect.width)/2;
    gameRect.y = (canvas.height-gameRect.height)/2;
}

function zoom(percent) {
    percent = percent/100;
    gameRect.width = canvas.width*(1/percent);
    gameRect.height = (gameMatrix.length/gameMatrix[0].length)*gameRect.width;
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
