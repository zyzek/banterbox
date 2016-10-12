// Prepare canvas
var canvas = document.getElementById('canvas')
var context = canvas.getContext('2d')
var width = window.innerWidth;
var height = window.innerHeight;

canvas.width = width;
canvas.height = height;

var buffer = [];
var time = 0;
var mouse_x = 0;
var max_worm_val = 2000;
var users = 50;
var max_worm_length = 200;
var test_scaling_height = 1;
var worm = [users*Math.random()];

// Time delta info for rendering
let old_time = Date.now();
let delta = 0;
vote_trend_frequency = 3;


var comment_data = [
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
]

var key_codes = {
    ENTER: 13,
    SPACE: 32
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

function parse_comment_data(data) {
  console.log(data) //TODO
}
function parse_vote_data(data) {
  console.log(data) //TODO
}

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


function roundRect(x, y, w, h, r) {
  // from: http://stackoverflow.com/a/7838871
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  context.beginPath();
  context.moveTo(x+r, y);
  context.arcTo(x+w, y,   x+w, y+h, r);
  context.arcTo(x+w, y+h, x,   y+h, r);
  context.arcTo(x,   y+h, x,   y,   r);
  context.arcTo(x,   y,   x+w, y,   r);
  context.fill();
  context.closePath();
  return this;
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

function draw_comments(left_bound, right_bound, mouse_x_point) {
    setCommentFill();
    context.beginPath();
    let min_comm_dist = 100; // the max distance from the mouse that a comment will pop up
    // min_comm_dist(px) on either side of comment, or the closest one
    // TODO: HCI STUDY ON WHAT VALUES BASED ON WHICH SCREEN WIDTHS

    let min_comm = null;

    for (let i = 0; i < comment_data.length; i++) {
        let comment = comment_data[i];
        if (comment.time > left_bound || comment.time < right_bound) {


            let x = (comment.time - left_bound) * ((width - 30) / (right_bound - left_bound - 1));
            let y = height - 30;
            context.arc(x, y, 10, 0, 2 * Math.PI);
            context.fill();

            if (Math.abs(mouse_x_point-x) < min_comm_dist) {
              min_comm_dist = Math.abs(mouse_x_point-x);
              min_comm = comment;
            }
        }
    }
    context.closePath()

    let padding = 5 // how many "time units" on either side of the comment to pick up
                    // 0 for only exact same time as the one selected

    if (min_comm) {
      let to_display = []
      for (let i = 0; i < comment_data.length; i++) {
        if (comment_data[i].time-padding <= min_comm.time && comment_data[i].time+padding >= min_comm.time ) {
          to_display.push(comment_data[i])
        }
      }
      context.strokeStyle = "black"

      for (let i=0; i<to_display.length; i++) {
        context.fillStyle = "white"
        let x = (min_comm.time - left_bound) * ((width - 30) / (right_bound - left_bound - 1));
        let y = 30+i*42;
        //context.moveTo(x,y);
        roundRect(x, y, 150, 40, 4)
        context.stroke()

        context.font="12px Georgia";
        context.fillStyle = "black"
        context.fillText(to_display[i].user,x+5, y+15);
        context.fillText(to_display[i].comment,x+5, y+30);

      }

    }

}


function draw_worm(worm, zoom = 100) {
    let mouseFound = false;
    let _x;
    let _y;
    const stepWidth = canvas.width / zoom;

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
        // Worm should grow from left to right
        context.moveTo(0, worm[0]);

        for (let i = 1; i < worm.length - 1; i++) {
            let x = i * stepWidth;
            let y = worm[i]*height/(max_worm_val*2)+(height/2)
            if (!mouseFound && x > mouse_x) {
                mouseFound = true;
                _x = x;
                _y = y;
            }
            context.lineTo(x, y);

        }
    } else {
        context.moveTo(0, worm[worm.length - zoom - 1]);
        for (let i = 1; i < zoom; i++) {
            let x = (i) * ((width - 30) / (zoom - 1));
            let y = worm[worm.length - zoom + i - 1]*height/(max_worm_val*2)+(height/2)
            if (!mouseFound && x > mouse_x) {
                mouseFound = true;
                _x = x;
                _y = y;
            }
            context.lineTo(x, y);
        }
    }
    context.stroke();
    context.closePath();

    draw_at_point(_x, _y);
    if (worm.length > zoom) {
        draw_comments(worm.length - zoom, worm.length, _x);
    } else {
        draw_comments(0, worm.length, _x);
    }
}

function linear_interpolate(weight, x_1, x_2) {
    // weight should be in the range [0, 1]
    return (weight * x_1) + ((1 - weight) * x_2);
}


/**
 * Update loop, all calculations go in here.
 * TODO : Add comments to explain what's being updated here
 */
function update() {

    //let vote_total = (Math.random()*users*test_scaling_height) * (Math.random() > 0.5 ? 1 : -1)
    trend = Math.cos(Date.now() / (vote_trend_frequency * 1000));
    let vote_total = worm[worm.length - 1] + users * linear_interpolate(0.9, 2*Math.random() - 1, trend);
    if (Math.abs(vote_total) > max_worm_val)
      max_worm_val = Math.abs(vote_total)

    worm.push(vote_total);
}

/**
 * Render loop, all drawing goes in here
 */
function render(){
    context.clearRect(0, 0, width, height);
    draw_worm(worm, max_worm_length);
}


/**
 * The render loop.
 * Will run at 60fps, but if the window has no focus it won't run at all.
 */
function animate() {
    let new_time = Date.now();
    delta = (new_time - old_time) / 1000;
    old_time = new_time;
    update()
    render()
    requestAnimationFrame(animate)
}
