// Prepare canvas

function Worm(container) {


    var canvas = container
    var context = canvas.getContext('2d')

    var width = window.innerWidth;
    var height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    var time = 0;
    var mouse_x = 0;
    var max_worm_val = 150;
    var users = 50;
    var max_worm_length = 20;
    var worm = [{y: 0, ts: Date.now()}, {y: 0, ts: Date.now()}];
    var man_trend = 0.5;

// Time delta info for rendering
    let old_time = Date.now();
    let delta = 0;
    var vote_trend_duration = 3000;
    var update_timer = 0;
    var update_rate = 250;


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

    setNormalFill();
    animate()


// Event bindings
    canvas.addEventListener('keydown', restart);
    canvas.addEventListener('mousemove', handleMouseMove);

    /**
     * Change width and height any time the window does
     */
    window.addEventListener('resize', function () {
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
            worm = [{y: 0, ts: Date.now()},{y: 0, ts: Date.now()}];
        }
    }

    function handleMouseMove(e) {
        mouse_x = e.clientX;
        console.log({
          x: e.clientX,
          y: e.clientY
        })
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
        context.moveTo(x + r, y);
        context.arcTo(x + w, y, x + w, y + h, r);
        context.arcTo(x + w, y + h, x, y + h, r);
        context.arcTo(x, y + h, x, y, r);
        context.arcTo(x, y, x + w, y, r);
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

                if (Math.abs(mouse_x_point - x) < min_comm_dist) {
                    min_comm_dist = Math.abs(mouse_x_point - x);
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
                if (comment_data[i].time - padding <= min_comm.time && comment_data[i].time + padding >= min_comm.time) {
                    to_display.push(comment_data[i])
                }
            }
            context.strokeStyle = "black"

            for (let i = 0; i < to_display.length; i++) {
                context.fillStyle = "white"
                let x = (min_comm.time - left_bound) * ((width - 30) / (right_bound - left_bound - 1));
                let y = 30 + i * 42;
                //context.moveTo(x,y);
                roundRect(x, y, 150, 40, 4)
                context.stroke()

                context.font = "12px Georgia";
                context.fillStyle = "black"
                context.fillText(to_display[i].user, x + 5, y + 15);
                context.fillText(to_display[i].comment, x + 5, y + 30);

            }

        }

    }

    function scale_worm_height(val) {
        return val * height / (max_worm_val * 2) + (height / 2);
    }

    function linear_interpolate(x_1, x_2, weight) {
        // weight should be in the range [0, 1]
        return (weight * x_2) + ((1 - weight) * x_1);
    }

    function k(x1, x2, weight) {
      return x1+((x2-x1)*weight)
    }

    function draw_worm(worm, zoom = 100) {
        let mouseFound = false;
        let _x;
        let _y;
        const stepWidth = canvas.width / zoom;

        // Create a gradient starting in top left corner and ending in top right corner
        var grad = context.createLinearGradient(0, 0, 0, canvas.height);

        // Set up colours for the gradient
        grad.addColorStop(0, "rgb(0,255,0)");
        grad.addColorStop(0.5, "rgb(200,200,0)");
        grad.addColorStop(1, "rgb(255,0,0)");

        context.beginPath();
        context.strokeStyle = grad;
        context.lineWidth = 4;
        if (worm.length <= zoom) {
            // Worm should grow from left to right
            context.moveTo(0, scale_worm_height(worm[0].y));
            let i = 0;
            let x, y;
            for (i = 1; i < worm.length - 1; i++) {
                x = i * stepWidth;
                y = scale_worm_height(worm[i].y);
                if (!mouseFound && x > mouse_x) {
                    mouseFound = true;
                    _x = x;
                    _y = y;
                }
                context.lineTo(x, y);
            }

            console.log(i, worm.length)
            if (worm.length > 2) {
              let next_x = (worm.length-1) * stepWidth;
              let next_y = scale_worm_height(worm[worm.length-1].y);
              console.log(update_timer/update_rate)
              x = linear_interpolate(x,next_x, update_timer/update_rate)
              y = linear_interpolate(y,next_y, update_timer/update_rate)
              context.lineTo(x,y)
            } else {
              let next_x = (1) * stepWidth;
              let next_y = scale_worm_height(worm[1].y);
              x = linear_interpolate(x,next_x, update_timer/update_rate)
              y = linear_interpolate(y,next_y, update_timer/update_rate)
              context.lineTo(x,y)
            }
        } else {
            console.log(worm.length, worm.length - zoom -2)
            let offset = -(update_timer/update_rate * ((width ) / (zoom - 1)));
            context.moveTo(offset, scale_worm_height(worm[worm.length - zoom ].y));
            let i=0;
            let x, y;


            for (i = 0; i < zoom-2; i++) {
                x = (i+1) * ((width ) / (zoom - 1));
                y = scale_worm_height(worm[worm.length - zoom + i +1].y);
                if (!mouseFound && x > mouse_x) {
                    mouseFound = true;
                    _x = x;
                    _y = y;
                }
                context.lineTo(x+offset, y);
            }
            console.log("=", x, y)
            x = (zoom - 2) * ((width ) / (zoom - 1));
            //x += offset
            let next_y = scale_worm_height(worm[worm.length-1].y);
            if (!mouseFound && x > mouse_x) {
                mouseFound = true;
                _x = x;
                _y = y;
            }
            //x = linear_interpolate(x, next_x, update_timer/update_rate)
            y = linear_interpolate(y, next_y, update_timer/update_rate)
            console.log(x, y)
            context.lineTo(x,y)
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



    /**
     * Update loop, all calculations go in here.
     * TODO : Add comments to explain what's being updated here
     */

     var vote_total = 0;
    function update() {
        update_timer += delta;
        if (update_timer > update_rate) {
            console.log(update_timer)
            update_timer = 0;

            trend = Math.cos(Date.now() / (vote_trend_duration));
            let vote_total = worm[worm.length - 1].y + (users * linear_interpolate(2 * Math.random() - 1, trend, 0.15));
            //vote_change = Math.random() < 0.5 ? -1 : 1

            /*vote_total += vote_change
            if (vote_total > users) {
              vote_total = users;
            }
            if (vote_total < -users) {
              vote_total = -users;
            }*/

            if (Math.abs(vote_total) > max_worm_val) {
                max_worm_val = Math.abs(vote_total);
            }

            worm.push({y: vote_total, ts: Date.now()});
        }
    }

    /**
     * Render loop, all drawing goes in here
     */
    function render() {
        context.clearRect(0, 0, width, height);
        draw_worm(worm, max_worm_length);
    }


    /**
     * The render loop.
     * Will run at 60fps, but if the window has no focus it won't run at all.
     */
    function animate() {
        delta = Date.now()-old_time
        old_time += delta

        update()
        render()
        requestAnimationFrame(animate)
    }

    return {
        addVote: {}
    }

}
