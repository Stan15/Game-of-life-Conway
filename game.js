let gameMatrix = Array.from(Array(50), _ => Array(50).fill(0));
for (let i=1;i<gameMatrix.length;i++) {
    gameMatrix[i][i] = 1;
}

let canvas = document.getElementById('gameOfLifeCanvas');
let ctx = canvas.getContext('2d');

let view_percent = 0.5;
let grid_view_size = resetViewSize();
let grid_view_offset = centerViewPos();
let max_view_offset = function () {return [gameMatrix[0].length-grid_view_size[0],gameMatrix.length-grid_view_size[1]]}

let drag = false;
let dragStart;
let dragEnd;
let dragSpeed;
draw()
canvas.addEventListener('mousedown', function(event) {
  dragStart = {
    x: event.pageX - canvas.offsetLeft,
    y: event.pageY - canvas.offsetTop
  }
  drag = true;
})
canvas.addEventListener('mouseup', function(event) {
    drag = false;
  })
canvas.addEventListener('mousemove', function(event) {
  if (drag) {
    dragEnd = {
      x: event.pageX - canvas.offsetLeft,
      y: event.pageY - canvas.offsetTop

    }
    let scale = grid_view_size[1]/canvas.width;
    //let growthCurveOffset = function(offset){let max_offset_speed=0.1*grid_view_size[1];let min_offset_speed = 0.0001;let rate=5;return (max_offset_speed*min_offset_speed*Math.exp(rate*offset))/(max_offset_speed+(min_offset_speed*(Math.exp(rate*offset)-1)))};
    grid_view_offset = [grid_view_offset[0]+((dragStart.x-dragEnd.x)*scale), grid_view_offset[1]+((dragStart.y-dragEnd.y)*scale)];
    grid_view_offset.forEach(function(offset,index) {
        if (offset >= max_view_offset[index]) {
            offset = max_view_offset[index];
        }else if (offset < 0) {
            offset = 0;
        }
    });
    draw()
  }

})

draw();

function draw() {
    ctx.save();
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    grid_view = getGridCoords();
    drawGrid(grid_view,2,'rgb(50,50,50)');
    ctx.restore();
}

function drawGrid(grid_coords,line_width,grid_color) {
    ctx.save();
    ctx.strokeStyle = grid_color;
    ctx.lineWidth = line_width;
    canvas_grid_coords = getCanvasGridCoords(grid_coords);
    canvas_grid_coords[0].forEach(element => {
        ctx.beginPath();
        ctx.moveTo(element,0);
        ctx.lineTo(element,canvas.height)
        ctx.stroke();
    });
    canvas_grid_coords[1].forEach(element => {
        ctx.beginPath();
        ctx.moveTo(0,element);
        ctx.lineTo(canvas.width,element)
        ctx.stroke();
    });
    ctx.restore();
}

function drawCells(grid_coords,cell_color,sizePercent) {
    let size_ratio = canvas.width/(grid_coords[0].slice(-1)[0]-grid_coords[0][0]);
    let grid_cell_size = size_ratio*1;
    let cell_size = sizePercent*(grid_cell_size) //how much of one grid cell does a cell occupy

    let grid_coords_X = grid_coords[0];
    let grid_coords_Y = grid_coords[1];

    for(let i=0;i<grid_coords_X.length-1;i++) {
        for(let j=0;j<grid_coords_Y.length-1;j++) {
            let colIdx = function (idx) {return grid_coords_X[idx]};
            let rowIdx = function (idx) {return grid_coords_Y[idx]};
            if (gameMatrix[Math.floor(rowIdx(i))][Math.floor(colIdx(j))] != 0) {
                let canvas_coords = getCanvasGridCoords(grid_coords);
                let canvas_coords_X = canvas_coords[0];
                let canvas_coords_Y = canvas_coords[1];
                let offset = [(grid_cell_size-cell_size)/2,(grid_cell_size-cell_size)/2];

                ctx.save();
                ctx.beginPath();
                roundedRectangle((canvas_coords_X[i]-((rowIdx(i)-Math.floor(rowIdx(i)))*size_ratio))+offset[0],(canvas_coords_Y[j]-((colIdx(i)-Math.floor(colIdx(i)))*size_ratio))+offset[1],cell_size,cell_size,2);
                ctx.fillStyle = cell_color;
                ctx.fill()
                ctx.restore();
            }
        }
    }

}

function getCanvasGridCoords(grid_coords) {
    //grid_coords is a nested list containing x_coords and y_coords
    let canvas_grid_coords = [];
    grid_coords.forEach(function(coords,index) {
        let canvas_size = [canvas.width,canvas.height];
        let grid_size = coords.slice(-1)[0]-coords[0];
        let size_ratio = canvas_size[0]/(grid_coords[0].slice(-1)[0]-grid_coords[0][0]);   //ratio of canvas width to grid width
        let canvas_offset = (canvas_size[index]-(grid_size*size_ratio))/2;
        canvas_grid_coords[index] = coords.map(element => ((element - coords[0])*size_ratio)+canvas_offset)   //removing offset relative to matrix, scaling the size of grid spacing relative to canvas, and adding offset relative to canvas,
    });
    return canvas_grid_coords
}

function getGridCoords() {  //get "coordinates" of where the grid lines in the gameMatrix are relative to the current view window
    start_coords = [grid_view_offset[0],grid_view_offset[1]];
    end_coords = [(grid_view_size[0])+grid_view_offset[0],(grid_view_size[1])+grid_view_offset[1]];

    let x_coords = [start_coords[0]];
    let y_coords = [start_coords[1]];

    let objects = [x_coords,y_coords];
    objects.forEach(function(item, index) {
        let run = true;
        while (run) {
            let current_coord = item.slice(-1)[0];
            let next_coord = Math.floor(current_coord+1);
            if (next_coord >= end_coords[index]) {
                item.push(end_coords[index]);
                run = false;
            }else {
                item.push(next_coord)
            }
        }
    });

    return [x_coords,y_coords]
}

function centerViewPos() {  //center the view of the gameMatrix
    let view_size = resetViewSize();
    let offsetX = (gameMatrix[0].length-(view_size[0]))/2;
    let offsetY = (gameMatrix.length-(view_size[1]))/2;
    
    return [offsetX,offsetY];
}

function resetViewSize() {  //reset the height and width of the view in case canvas size changes. view_width/view_height should equal canvas.width/canvas.height
    view_width = gameMatrix[0].length*view_percent;
    view_height = (canvas.height/canvas.width)*view_width;
    if (view_height>gameMatrix.length) {
        view_height = gameMatrix.length;
    }
    
    return [view_width,view_height]
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
