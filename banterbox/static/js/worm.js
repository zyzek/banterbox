var context = null;

var width = 0;
var height = 0;

var worm = [];
var mouse_x = 0;

var maxVals = 200;

var data = [
    {
        time:27,
        user:"acol6969",
        comment:"lecture getting good!"
    },
    {
        time:66,
        user:"acol6969",
        comment:"haha! spam!"
    },
    {
        time:133,
        user:"acol6969",
        comment:"great lecture!"
    },
    {
        time:133,
        user:"acol6969",
        comment:"terrible lecture!"
    }
];


function setNormalFill() {context.fillStyle = "rgb(239, 5, 239)"; context.strokeStyle = "rgb(239, 5, 239)"; context.lineWidth = 4;}
function setThinLine() { context.fillStyle = "rgb(255, 255, 255)"; context.strokeStyle = "rgb(255, 255, 255)"; context.lineWidth = 1;}
function setCommentFill() {context.fillStyle = "rgb(128,0,128)"; context.strokeStyle = "rgb(128,0,128)"; context.linewidth = 4;}


$('#canvas').on('mousemove', handleMouseMove);

function handleMouseMove(e){
    //console.log({x: e.clientX, y:e.clientY})
    mouse_x = e.clientX;
}


function draw_at_point(x, y) {
    setThinLine();
    context.beginPath();
    context.arc(mouse_x,y,5,0,2*Math.PI);
    context.fill();
    context.moveTo(mouse_x,0);
    context.lineTo(mouse_x,height);
    context.stroke();
    context.closePath();
}

function draw_comments(left_bound, right_bound) {
    setCommentFill();
    context.beginPath();
    for (let i=0; i< data.length; i++) {
        let comment = data[i];
        //console.log(comment);
        if (comment.time > left_bound || comment.time < right_bound ) {
            let x = (comment.time-left_bound) * ((width - 30) / (right_bound-left_bound - 1));
            let y = height - 30;
            context.arc(x,y,10,0,2*Math.PI);
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


function draw_worm(worm, zoom=100) {
    //setNormalFill();
    let mouseFound = false;
    let _x;
    let _y;

    //context.beginPath();


    var grad= context.createLinearGradient(50, 50, 150, 150);
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
        context.moveTo(0, worm[worm.length-zoom-1]);
        for (let i = 1; i < zoom; i++) {
            let x = (i) * ((width - 30) / (zoom - 1));
            if (!mouseFound && x > mouse_x) {
                mouseFound = true;
                _x = x;
                _y = worm[worm.length-zoom+i-1];
            }
            context.lineTo(x, worm[worm.length-zoom+i-1]);
        }
    }
    context.stroke();
    context.closePath();

    draw_at_point(_x, _y);
    if (worm.length > zoom) {
        draw_comments(worm.length-zoom, worm.length);
    } else  {
        draw_comments(0, worm.length);
    }
}


function update() {

    context.clearRect(0, 0, width, height);

    let y = Math.floor(Math.random()*40-30);
    y = worm[worm.length-1]+y;

    if (y<30) {
        y = 30;
    } else if (y > height-30) {
        y = height-30;
    }
    //y = height/2;
    //console.log(worm);
    worm.push(y);

    draw_worm(worm, maxVals);
}

function restart() {
    worm = [height/2];
}



$(document).ready(function() {
    let canvas = $("#canvas");
    context = canvas.get(0).getContext("2d");

    width = window.innerWidth;  
    height = window.innerHeight;
    context.canvas.width = width;
    context.canvas.height = height;

    worm.push(height/2);
    angleSliderPosition = height/2;

    setNormalFill();

    setInterval(update, 30);

    canvas.bind('keydown.return', restart);
    canvas.focus();
});