// TODO: Better vertical scaling
// TODO: Comments and class organisation
// TODO: Dynamically handle varying update delays

class Worm {

    constructor(container) {
        this.canvas = container
        this.context = this.canvas.getContext('2d')
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.mouse_x = 0;
        this.max_worm_val = 150;
        this.users = 50;
        this.max_worm_length = 100;
        this.data = [{y: 0, ts: Date.now()}, {y: 0, ts: Date.now()}];
        this.vote_total = 0;

        // Time delta info for rendering
        this.old_time = Date.now();
        this.delta = 0;
        this.update_timer = 0;
        this.update_delay = 100;

        this.comment_data = [
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

        this.key_codes = {
            ENTER: 13,
            SPACE: 32
        }
        // Init

        this.animate = this.animate.bind(this);

        this.setNormalFill();
        this.animate()

        // Event bindings
        this.canvas.addEventListener('keydown', this.restart);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);

        /**
         * Change width and height any time the window does
         */
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        })
    }


    /**
     * Render loop, all drawing goes in here
     */
    render() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw_worm_end(100, 20);
    }


    /**
     * The render loop.
     * Will run at 60fps, but if the window has no focus it won't run at all.
     */
    animate() {
        this.delta = Date.now() - this.old_time
        this.old_time += this.delta

        this.update()
        this.render()
        requestAnimationFrame(this.animate)
    }

    parse_comment_data(data) {
        console.log(data) //TODO
    }

    parse_vote_data(data) {
        console.log(data) //TODO
    }

    /**
     * Restarts the canvas data if enter is pressed
     * @param e
     */
    restart(e) {
        if (e.which === this.key_codes.ENTER) {
            data = [{y: 0, ts: Date.now()},{y: 0, ts: Date.now()}];
        }
    }

    handleMouseMove(e) {
        this.mouse_x = e.clientX;
    }

    setNormalFill() {
        this.context.fillStyle = "rgb(239, 5, 239)";
        this.context.strokeStyle = "rgb(239, 5, 239)";
        this.context.lineWidth = 10;
    }

    setThinLine() {
        this.context.fillStyle = "rgb(255, 255, 255)";
        this.context.strokeStyle = "rgb(255, 255, 255)";
        this.context.lineWidth = 1;
    }

    setCommentFill() {
        this.context.fillStyle = "rgb(128,0,128)";
        this.context.strokeStyle = "rgb(128,0,128)";
        this.context.linewidth = 4;
    }

    roundRect(x, y, w, h, r) {
        // from: http://stackoverflow.com/a/7838871
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.context.beginPath();
        this.context.moveTo(x + r, y);
        this.context.arcTo(x + w, y, x + w, y + h, r);
        this.context.arcTo(x + w, y + h, x, y + h, r);
        this.context.arcTo(x, y + h, x, y, r);
        this.context.arcTo(x, y, x + w, y, r);
        this.context.fill();
        this.context.closePath();
        return this;
    }

    // Given an absolute worm value, return the vertical position it would be rendered at.
    scale_worm_height(val) {
        return (val * this.canvas.height / (this.max_worm_val * 2)) + (this.canvas.height / 2);
    }

    // Map linearly over [0,1] -> [x1, x2]
    lerp(x1, x2, t) {
        return x1 + t*(x2 - x1);
    }

    /* The proportion of the last update step that has been rendered.
     *  E.g. If the time between the last two updates was 100 milliseconds,
     *  and 50 milliseconds has passed since the last update, return 0.5. */
    update_fraction_elapsed() {
        return this.update_timer / this.update_delay;
    }

    /* Draw the last num_points points of the worm, padding with end_pad_size
     * imaginary points on the right hand side.
     * If num_points exceeds the available data, the worm should draw from left
     * to right until it reaches the padding, and then it should scroll. */
    draw_worm_end(num_points, end_pad_size) {
        // Draw the laast
        let start = Math.max(0, (this.data.length - 1) - num_points);
        let end = Math.max(num_points + end_pad_size, this.data.length - 1 + end_pad_size);
        let offset = num_points > this.data.length - 1 ? 0 : (this.canvas.width / (start - end - 1)) * this.update_fraction_elapsed();
        this.draw_worm_slice(start, end, offset);
    }

    /* Draw a slice of the worm between x_start and x_end, to fill up the canvas
     * horizontally.
     * x_offset_pixels will displace the drawing of the worm, which is used for
     * smooth scrolling .
     * If x_end exceeds the end of the worm data, empty space will be rendered
     * past the end of the worm.
     */
    draw_worm_slice(x_start, x_end, x_offset_pixels = 0) {

        // Render settings and parameters.
        var grad = this.context.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, "rgb(0,255,0)");
        grad.addColorStop(0.5, "rgb(200,200,0)");
        grad.addColorStop(1, "rgb(255,0,0)");

        this.context.beginPath();
        this.context.strokeStyle = grad;
        this.context.lineWidth = 4;

        // The total width of the slice being rendered
        let slice_width = x_end - x_start;
        // The distance between individual worm segments.
        let segment_width = this.canvas.width / slice_width;
        let update_fraction = this.update_fraction_elapsed();

        // Initialise the first point to the first available datum or else 0.
        let initial = (x_start < this.data.length) ? this.data[x_start] : 0;
        this.context.moveTo(x_offset_pixels, initial);

        let x;
        let y;

        // Draw the actual body of the worm.
        for (let i = x_start; i < x_end && i < this.data.length - 1; ++i) {
            x = (i - x_start) * segment_width;
            y = this.scale_worm_height(this.data[i].y);
            this.context.lineTo(x + x_offset_pixels, y);
        }

        // The last worm segment interpolates smoothly between data updates.
        if (x_end > this.data.length) {
            let i = this.data.length - 1;
            let last_x = (i - x_start) * segment_width;
            let last_y = this.scale_worm_height(this.data[i].y);
            x = this.lerp(x, last_x, update_fraction);
            y = this.lerp(y, last_y, update_fraction);
            this.context.lineTo(x + x_offset_pixels, y);
        }

        this.context.stroke();
        this.context.closePath();
    }

    draw_worm(zoom = 100) {
        let mouseFound = false;

        let _x;
        let _y;
        const stepWidth = this.canvas.width / zoom;
        let update_fraction = this.update_timer / this.update_delay;

        // Set up a vertical colour gradient for the worm
        var grad = this.context.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, "rgb(0,255,0)");
        grad.addColorStop(0.5, "rgb(200,200,0)");
        grad.addColorStop(1, "rgb(255,0,0)");

        this.context.beginPath();
        this.context.strokeStyle = grad;
        this.context.lineWidth = 4;

        if (this.data.length <= zoom) {

            // Worm should grow from left to right
            this.context.moveTo(0, this.scale_worm_height(this.data[0].y));
            let i = 0;
            let x, y;
            for (i = 1; i < this.data.length - 1; i++) {
                x = i * stepWidth;
                y = this.scale_worm_height(this.data[i].y);

                if (!mouseFound && x > this.mouse_x) {
                    mouseFound = true;
                    _x = x;
                    _y = y;
                }
                this.context.lineTo(x, y);
            }

            if (this.data.length > 2) {
              let next_x = (this.data.length - 1) * stepWidth;
              let next_y = this.scale_worm_height(this.data[this.data.length-1].y);
              x = this.lerp(x,next_x, update_fraction)
              y = this.lerp(y,next_y, update_fraction)
              this.context.lineTo(x,y)
            } else {
              let next_x = (1) * stepWidth;
              let next_y = this.scale_worm_height(this.data[1].y);
              x = this.lerp(x,next_x, update_fraction)
              y = this.lerp(y,next_y, update_fraction)
              this.context.lineTo(x,y)
            }
        } else {
            let offset = -(update_fraction * ((this.canvas.width ) / (zoom - 1)));
            this.context.moveTo(offset, this.scale_worm_height(this.data[this.data.length - zoom ].y));
            let i=0;
            let x, y;


            for (i = 0; i < zoom-2; i++) {
                x = (i+1) * ((this.canvas.width ) / (zoom - 1));
                y = this.scale_worm_height(this.data[this.data.length - zoom + i +1].y);
                if (!mouseFound && x > this.mouse_x) {
                    mouseFound = true;
                    _x = x;
                    _y = y;
                }
                this.context.lineTo(x+offset, y);
            }
            x = (zoom - 2) * ((this.canvas.width ) / (zoom - 1));
            //x += offset
            let next_y = this.scale_worm_height(this.data[this.data.length-1].y);
            if (!mouseFound && x > this.mouse_x) {
                mouseFound = true;
                _x = x;
                _y = y;
            }
            //x = this.lerp(x, next_x, update_fraction)
            y = this.lerp(y, next_y, update_fraction)
            this.context.lineTo(x,y)
        }

        this.context.stroke();
        this.context.closePath();

        this.draw_at_point(_x, _y);
        if (this.data.length > zoom) {
            this.draw_comments(this.data.length - zoom, this.data.length, _x);
        } else {
            this.draw_comments(0, this.data.length, _x);
        }
    }



    /**
     * Update loop, all calculations go in here.
     * TODO : Add comments to explain what's being updated here
     */

    update() {
        this.update_timer += this.delta;
        if (this.update_timer > this.update_delay) {
            this.update_timer = 0;

            let vote_trend_duration = 3000;
            let trend = Math.cos(Date.now() / vote_trend_duration);
            this.vote_total = this.data[this.data.length - 1].y + (this.users * this.lerp(2 * Math.random() - 1, trend, 0.15));
            //vote_change = Math.random() < 0.5 ? -1 : 1

            /*this.vote_total += vote_change
            if (this.vote_total > this.users) {
              this.vote_total = this.users;
            }
            if (this.vote_total < -this.users) {
              this.vote_total = -this.users;
            }*/

            if (Math.abs(this.vote_total) > this.max_worm_val) {
                this.max_worm_val = Math.abs(this.vote_total);
            }

            this.data.push({y: this.vote_total, ts: Date.now()});
        }
    }


    draw_at_point(x, y) {
        this.setThinLine();
        this.context.beginPath();
        this.context.arc(this.mouse_x, y, 5, 0, 2 * Math.PI);
        this.context.fill();
        this.context.moveTo(this.mouse_x, 0);
        this.context.lineTo(this.mouse_x, this.canvas.height);
        this.context.stroke();
        this.context.closePath();
    }

    draw_comments(left_bound, right_bound, mouse_x_point) {
        this.setCommentFill();
        this.context.beginPath();
        let min_comm_dist = 100; // the max distance from the mouse that a comment will pop up
        // min_comm_dist(px) on either side of comment, or the closest one
        // TODO: HCI STUDY ON WHAT VALUES BASED ON WHICH SCREEN WIDTHS

        let min_comm = null;

        for (let i = 0; i < this.comment_data.length; i++) {
            let comment = this.comment_data[i];
            if (comment.time > left_bound || comment.time < right_bound) {


                let x = (comment.time - left_bound) * ((this.canvas.width - 30) / (right_bound - left_bound - 1));
                let y = this.canvas.height - 30;
                this.context.arc(x, y, 10, 0, 2 * Math.PI);
                this.context.fill();

                if (Math.abs(mouse_x_point - x) < min_comm_dist) {
                    min_comm_dist = Math.abs(mouse_x_point - x);
                    min_comm = comment;
                }
            }
        }
        this.context.closePath()

        let padding = 5 // how many "time units" on either side of the comment to pick up
                        // 0 for only exact same time as the one selected

        if (min_comm) {
            let to_display = []
            for (let i = 0; i < this.comment_data.length; i++) {
                if (this.comment_data[i].time - padding <= min_comm.time && this.comment_data[i].time + padding >= min_comm.time) {
                    to_display.push(this.comment_data[i])
                }
            }
            this.context.strokeStyle = "black"

            for (let i = 0; i < to_display.length; i++) {
                this.context.fillStyle = "white"
                let x = (min_comm.time - left_bound) * ((this.canvas.width - 30) / (right_bound - left_bound - 1));
                let y = 30 + i * 42;
                //this.context.moveTo(x,y);
                this.roundRect(x, y, 150, 40, 4)
                this.context.stroke()

                this.context.font = "12px Georgia";
                this.context.fillStyle = "black"
                this.context.fillText(to_display[i].user, x + 5, y + 15);
                this.context.fillText(to_display[i].comment, x + 5, y + 30);

            }
        }
    }
}
