// Prepare canvas
var canvas = document.getElementById('canvas')
var context = canvas.getContext('2d')
var width = window.innerWidth;
var height = window.innerHeight;

canvas.width = width;
canvas.height = height;

var worm = [];
var mouse_x = 0;

var max_values = 200;

var data = [
    {
        time: 27,
        user: "acol6969",
        comment: "lecture getting good!"
    },
    {
        time: 66,
        user: "acol6969",
        comment: "haha! spam!"
    },
    {
        time: 133,
        user: "acol6969",
        comment: "great lecture!"
    },
    {
        time: 133,
        user: "acol6969",
        comment: "terrible lecture!"
    }
];

var key_codes = {
    ENTER: 13,
    SPACE: 32,
}


// Init
worm.push(height / 2);
angleSliderPosition = height / 2;
setNormalFill();
animate()


// Event bindings
canvas.addEventListener('keydown', restart);
canvas.addEventListener('mousemove', handleMouseMove);

/**
 * Change width and height any time the window does
 */
window.addEventListener('resize', function(){
    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight
})

/**
 * Restarts the canvas data if enter is pressed
 * @param e
 */
function restart(e) {
    if (e.which === key_codes.ENTER) {
        worm = [height / 2];
    }
}

function handleMouseMove(e) {
    mouse_x = e.clientX;
}



function setNormalFill() {
    context.fillStyle = "rgb(239, 5, 239)";
    context.strokeStyle = "rgb(239, 5, 239)";
    context.lineWidth = 10;
}
function setThinLine() {
    context.fillStyle = "rgb(255, 255, 255)";
    context.strokeStyle = "rgb(255, 255, 255)";
    context.lineWidth = 1;
}
function setCommentFill() {
    context.fillStyle = "rgb(128,0,128)";
    context.strokeStyle = "rgb(128,0,128)";
    context.linewidth = 4;
}





function draw_at_point(x, y) {
    setThinLine();
    context.beginPath();
    context.arc(mouse_x, y, 5, 0, 2 * Math.PI);
    context.fill();
    context.moveTo(mouse_x, 0);
    context.lineTo(mouse_x, height);
    context.stroke();
    context.closePath();
}

function draw_comments(left_bound, right_bound) {
    setCommentFill();
    context.beginPath();
    for (let i = 0; i < data.length; i++) {
        let comment = data[i];

        if (comment.time > left_bound || comment.time < right_bound) {
            let x = (comment.time - left_bound) * ((width - 30) / (right_bound - left_bound - 1));
            let y = height - 30;
            context.arc(x, y, 10, 0, 2 * Math.PI);
            context.fill();
        }
    }
    context.closePath();
}

//var rainbow_colours = ['ff0000', 'ffff00', '00ff00', '0000ff'];
//
//function set_rainbow_colour(x,min_x,max_x) {
//
//    if (x < (max_x-min_x)/3) {
//        context.strokeStyle = "rgb(255," +(255 * (x / ((max_x - min_x) / 3)))+ ",0)";
//    } else if (x < 2*(max_x-min_x)/3) {
//        context.strokeStyle = "rgb("+(255-255*((x-(max_x-min_x)/3)/((max_x-min_x)/3))) + ",255,0)";
//    }
//    else if (x < 3*(max_x-min_x)/3) {
//        context.strokeStyle =  "rgb(0,"+ (255 - 255 * ((x - 2 * (max_x - min_x) / 3) / ((max_x - min_x) / 3))) +"," +( 255 * ((x - 2 * (max_x - min_x) / 3) / ((max_x - min_x) / 3)))+")";
//    }
//}


function draw_worm(worm, zoom = 100) {
    let mouseFound = false;
    let _x;
    let _y;


    // Create a gradient starting in top left corner and ending in top right corner
    var grad = context.createLinearGradient(0, 0, canvas.width, 0);

    // Set up colours for the gradient
    grad.addColorStop(0, "rgb(255,0,0)");
    grad.addColorStop(0.33, "rgb(255,255,0)");
    grad.addColorStop(0.66, "rgb(0,255,0)");
    grad.addColorStop(1, "rgb(0,0,255)");


    context.beginPath();
    context.strokeStyle = grad;
    context.lineWidth = 4;

    if (worm.length < zoom) {

        context.moveTo(0, worm[0]);

        for (let i = 1; i < worm.length; i++) {
            let x = i * ((width - 30) / (worm.length - 1));
            if (!mouseFound && x > mouse_x) {
                mouseFound = true;
                _x = x;
                _y = worm[i];
            }
            context.lineTo(x, worm[i]);

        }

    } else {
        context.moveTo(0, worm[worm.length - zoom - 1]);
        for (let i = 1; i < zoom; i++) {
            let x = (i) * ((width - 30) / (zoom - 1));
            if (!mouseFound && x > mouse_x) {
                mouseFound = true;
                _x = x;
                _y = worm[worm.length - zoom + i - 1];
            }
            context.lineTo(x, worm[worm.length - zoom + i - 1]);
        }
    }
    context.stroke();
    context.closePath();

    draw_at_point(_x, _y);
    if (worm.length > zoom) {
        draw_comments(worm.length - zoom, worm.length);
    } else {
        draw_comments(0, worm.length);
    }
}


/**
 * Update loop, all calculations go in here.
 * TODO : Add comments to explain what's being updated here
 */
function update() {

    // Prettier fake data!
    let change_rate = 9.45
    let y = (Math.random() * change_rate) * (Math.random() > 0.5 ? 1 : -1)
    y += worm[worm.length -1]

    // Make sure it stays within screen limitations
    if(y < 0){
        y = 0;
    }else if(y > window.innerHeight){
        y  = window.innerHeight
    }


    worm.push(y);
}

/**
 * Render loop, all drawing goes in here
 */
function render(){
    context.clearRect(0, 0, width, height);
    draw_worm(worm, max_values);
}


/**
 * The render loop.
 * Will run at 60fps, but if the window has no focus it won't run at all.
 */
function animate() {
    update()
    render()
    requestAnimationFrame(animate)
}

