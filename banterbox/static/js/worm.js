// TODO: Historic data on join
// TODO: scrolling + zooming when not tracking
// TODO: Worm end rendering at correct posish.

// TODO: Make the comments look half-decent.
//       Better blips
//       colours per user (hash)

// TODO: If no information, assume the vote stays the same (then the server need only send out updates when vote totals change)

// TODO: Worm range rescaling a little better. (don't scale down as fast as scaling up)
// TODO: Improve draw_end tracking to be more robust to slow worm updates.
//       E.G. stop autoscrolling if too far past worm end
// TODO: If worm updates lag behind current time, move the clearing rectangle back
//       to make it catch up to realtime faster, and not be jerky
// TODO: Render gridlines

// TODO: give the worm an end cap now that we're just lopping it.
// TODO: Make comments etc. more parametric
// TODO: Add add background and comment style-setting functions
// TODO: refactor to handle raw yes/no counts and render attendance as well as rating.
// TODO: Fix worm gradient when y offset is applied.


class Worm {


/* ==================== Constructor and Friends ==================== */


    constructor(container_fg, container_bg, socket) {

        // Initialise the canvases and contexts.
        this.fg_canvas = container_fg;
        this.fg_context = this.fg_canvas.getContext('2d');
        this.bg_canvas = container_bg;
        this.bg_context = this.bg_canvas.getContext('2d');

        // Set up the networking.
        this.socket = socket;
        this.set_up_socket();

        // Set up input handlers.
        this.set_up_event_listeners();

        // Set up worm logical/temporal state.
        this.set_up_state();

        // Initialise rendering info.
        this.set_up_rendering_state();

        // Initialise update and render loop functions.
        this.set_up_loop_functions();

        // RELEASE THE WORM
        this.run = this.run.bind(this);
        this.run()
    }


    /* Set up all the listeners and emitters on the socket, and emit the first sync
     * message. Make sure the socket is actually initialised before calling this. */
    set_up_socket() {
        this.socket.on('timestamp', (data) => {
            let serv_time = data.timestamp;
            let client_time = Date.now();
            this.serv_time_diff = serv_time - (this.sync_time + client_time)/2;
        });

        this.socket.on('votes', (data) => {
            this.push_data((data.votes.yes - data.votes.no), data.timestamp)
        });

        this.socket.on('comment', comment => {
            this.push_comment(comment.author, comment.content, comment.timestamp);
        });

        // TODO: get the historical data integrating properly into the worm.
        /*this.socket.on('vote_history', data => {
            // Data might come unsorted?
            console.log(data);
        });
        socket.on('comment_history', data => {

        });
        */

        setInterval(() => {
            this.sync_time = Date.now();
            this.socket.emit('timestamp');
        }, 10000);

        this.socket.emit('timestamp');
    }


    /* Set up all the listeners for input events. */
    set_up_event_listeners() {
        // Make the canvas resize with the window.
        window.addEventListener('resize', () => {
            this.update_dimensions()
            this.set_style({gradient: true})
        });

        // Zoom the time slice viewed when the mouse wheel is scrolled.
        // The duration is clamped to between 5 seconds and 2 hours.
        this.zoom_speed = 1.001;
        this.fg_canvas.addEventListener('wheel', (event) => {
            if (this.mouse_on_canvas) {
                this.render_duration = Math.min(1000 * 60 * 60 * 2 + 1000, Math.max(5000, this.render_duration * Math.pow(this.zoom_speed, event.deltaY)));
                event.preventDefault();
                return false;
            }
        });

        // Determine when the mouse is or is not on the canvas.
        this.mouse_on_canvas = false;
        this.fg_canvas.addEventListener('mouseenter', () => {this.mouse_on_canvas = true;});
        this.fg_canvas.addEventListener('mouseleave', () => {this.mouse_on_canvas = false;});

        // Whenever the mouse IS on the canvas, capture its position.
        this.mouse_x = 0;
        this.fg_canvas.addEventListener('mousemove', (event) => {this.mouse_x = event.offsetX;});
    }


    /* Initialise the render and update loop function structures. */
    set_up_loop_functions() {
        // Set up functions to run every update step.
        this.update_functions = {};

        this.rescale_to_max_in_view = this.rescale_to_max_in_view.bind(this);
        this.update_functions.rescale = this.rescale_to_max_in_view;

        // Used for fake data generation (but could be handy at some point)
        this.random_users = 50;
        /* Function to add a fake data point to the end of the worm every update_delay milliseconds. */
        this.add_fake_point = this.add_fake_point.bind(this);
        this.add_fake_comment = this.add_fake_comment.bind(this);

        // And functions to run every rendered frame.
        this.render_functions = {};
        this.draw_luke = this.draw_luke.bind(this);
    }


    /* Initialise what information is needful for drawing. */
    set_up_rendering_state() {
        // Render the last render_duration milliseconds.
        this.render_duration = 20000;
        // Defines the size of empty space on the right side of the worm.
        this.pad_duration = 0;
        // Defines a buffer of updates not to be rendered.
        // This should be at least twice the length of the update duration.
        // The lower the more responsive. The higher, the more robust to missing data.
        this.buffer_duration = 2000;
        // Defines the maximum number of worm segments to render.
        this.max_render_segments = 100;
        // Whether to automatically track the end of the worm or not.
        this.auto_track = true;

        // Used for vertical scaling.
        // Maximum magnitude the worm's value has reached (should be at least min_range)
        this.max_magnitude = 5;
        this.min_range = 5;
        this.display_range = this.min_range;
        this.y_offset_pixels = 0;
        this.rescale_target_range = 150;
        this.rescale_start_range = 150;
        this.rescale_start_time = 0;
        this.rescale_duration = 0;
        this.rescale_threshold = 1.2;
        this.rescale_duration = 500;
        this.rescaling = false;
        this.auto_rescale = true;
        this.update_dimensions()

        // A structure that contains the actual slice of time being rendered.
        this.rendered_time_slice = {start: 0,
                                end:10,
                                duration: () => {return this.rendered_time_slice.end - this.rendered_time_slice.start},
                                pixels_per_millisecond: () => { return this.fg_canvas.width / this.rendered_time_slice.duration()}
                               }

        // Render settings and parameters.
        this.thickness = 1;
        this.set_style({smoothing: "quadratic",
                        gradient: true,
                        thickness: 2});

        // Comment rendering / pop-in parameters.
        this.comment_blip_radius = 15;
        this.comment_max_dist = 50;
        this.comment_min_dist = 20;
        this.comment_min_height = 10;
        this.comment_max_height = 30;
    }


    /* Initialise actual worm state data structures and timing information. */
    set_up_state() {
        const now = Date.now();

        // Timer information
        this.prev_tick = now;
        this.delta = 0;
        this.start_timestamp = now;
        this.serv_time_diff = 0;
        this.sync_time = now;

        // The actual worm and comment data itself. Initialise these arrays with
        // dummy data to facilitate functions that assume that they are non-empty.
        this.data = [{value: 0, timestamp: now - 100}, {value: 0, timestamp: now}];
        this.comments = [{author: "Charon", text:"Scylla and Charybdis hunger for thee...", timestamp: now - 10000000}];

    }


/* ==================== Main Loop Functions ==================== */


    /* The main loop.
     * This runs only when the window has focus. */
    run() {
        this.update();
        this.render();
        requestAnimationFrame(this.run);
    }


    /* Draw a frame */
    render() {
        this.bg_context.clearRect(0, 0, this.bg_canvas.width, this.bg_canvas.height);
        this.draw_zero_line();
        this.draw_comment_blips();
        this.draw_time_slice_indicators();
        if (this.mouse_on_canvas) {
            this.draw_mouse_line(this.mouse_x);
        }

        this.fg_context.clearRect(0, 0, this.fg_canvas.width, this.fg_canvas.height);
        if (this.auto_track) {
            this.draw_end(this.render_duration, this.pad_duration);
        }
        else {
            this.draw_slice(this.rendered_time_slice.start, this.rendered_time_slice.end, this.display_range, this.y_offset_pixels);
        }

        Object.keys(this.render_functions).forEach((key) => {this.render_functions[key]()})

        this.smooth_rescale()
    }


    /* Update the state of the worm by a tick. */
    update() {
        const now = Date.now();
        this.delta = now - this.prev_tick;
        this.prev_tick = now;

        Object.keys(this.update_functions).forEach((key) => {this.update_functions[key]()})
    }


/* ==================== State Management ==================== */


    /* Push a new data point to the end of the worm. */
    push_data(value, timestamp) {
        // Since we assume the data series is monotonically increasing with time,
        // discard any time-travelling messages.
        if (timestamp < this.data[this.data.length - 1].timestamp) {
            return;
        }

        this.max_magnitude = Math.max(this.max_magnitude, Math.abs(value));
        this.data.push({value: value, timestamp: timestamp});
    }


    /* Push a new comment to the end of the comment list. */
    push_comment(author, text, timestamp) {
        // We'll insert comments in the correct place they should appear.
        // Most of the time they'll be arriving in order, so this should be low-overhead, if we search backwards.
        // Since comments are more meaningful and individual than data points,
        // we choose expend more effort to insert them into our array.
        let index = _.findLastIndex(this.comments, (c) => c.timestamp < timestamp);
        index = index >= 0 ? index + 1 : 0;
        this.comments.splice(index, 0, {author: author, text: text, timestamp: timestamp});
    }





/* ==================== Rendering ==================== */


    /* Update the current canvas dimensions. */
    update_dimensions() {
        const fg_rect = this.fg_canvas.parentElement.getBoundingClientRect();
        const bg_rect = this.bg_canvas.parentElement.getBoundingClientRect();
        this.fg_canvas.width = fg_rect.width;
        this.fg_canvas.height = fg_rect.height;
        this.bg_canvas.width = bg_rect.width;
        this.bg_canvas.height = bg_rect.height;
        this.set_style({gradient: true})
    }


    /* Initiate a rescale of the worm to target_range over duration milliseconds. */
    rescale_to(target_range, duration) {
        // If the rescale is within the minimum range, or if it would do nothing, return.
        if ((target_range <= this.min_range && this.display_range <= this.min_range) || target_range == this.display_range) {
            return;
        }

        this.rescale_start_time = Date.now();
        this.rescale_start_range = this.display_range;
        this.rescale_target_range = Math.max(this.min_range, target_range);
        this.rescale_duration = duration;
        this.rescaling = true;
    }


    /* Smoothly perform one step of an active rescale, and disable scaling once
       the interpolation is complete. */
    smooth_rescale() {
        const now = Date.now();

        if (this.rescale_start_time + this.rescale_duration < now) {
            this.rescaling = false;
        }

        if (this.rescaling) {
            const fraction_elapsed = (now - this.rescale_start_time) / this.rescale_duration;
            this.display_range = this.ease_interp(this.rescale_start_range, this.rescale_target_range, fraction_elapsed);
            this.set_style({gradient: true});
        }
    }


    /* If the provided value is out of the displayed range,
     * rescale so as to be able to display it. */
    rescale_if_out_of_range(val) {
        const range = Math.abs(val);
        const target = range * this.rescale_threshold;
        if (this.auto_rescale && (target > this.display_range)) {
                const overshoot_ratio = range/this.display_range;
                this.rescale_to(target, this.rescale_duration/overshoot_ratio);
        }
    }


    /* If the maximum worm value in view is too big, rescale the displayed worm. */
    rescale_to_max_in_view() {
        if (this.auto_rescale && !this.rescaling) {
            const slice = this.time_slice(this.rendered_time_slice.start, Math.min(this.rendered_time_slice.end, this.end_time()));
            if (slice.length > 0) {
                const max_abs = slice.reduce((prev, curr) => Math.max(prev, Math.abs(curr.value)), 0);
                const target = max_abs * this.rescale_threshold;
                this.rescale_to(target, this.rescale_duration);
            }
        }
    }

    /* Draw a horizontal rule denoting the 0 vote level. */
    draw_zero_line() {
        this.bg_context.save();
        this.bg_context.beginPath();
        this.bg_context.lineWidth = 1;
        this.bg_context.strokeStyle = "#777777";
        let zero_height = this.value_to_screen_space(0, this.display_range, this.y_offset_pixels);
        this.bg_context.moveTo(0, zero_height);
        this.bg_context.lineTo(this.bg_canvas.width, zero_height);
        this.bg_context.stroke();
        this.bg_context.restore();
    }


    /* Draw the indicators of the displayed time slice. */
    draw_time_slice_indicators() {
        const start_indicator = this.hours_mins_secs_string(this.rendered_time_slice.start - this.start_timestamp);
        const end_indicator = this.hours_mins_secs_string(this.rendered_time_slice.end - this.start_timestamp);

        this.bg_context.save();
        this.bg_context.fillStyle = "#FFFFFF";
        this.bg_context.font = "20px sans-serif";
        this.bg_context.fillText(start_indicator, 5, this.bg_canvas.height - 5);
        this.bg_context.textAlign = "right";
        this.bg_context.fillText(end_indicator, this.bg_canvas.width - 5, this.bg_canvas.height - 5);
        this.bg_context.restore();
    }


    /* Draw the mouse line and its associated time + value indicators. */
    draw_mouse_line(x) {
        const mouse_time = this.screen_space_to_timestamp(x)
        const time_indicator = this.hours_mins_secs_string(mouse_time - this.start_timestamp);

        let val_string = "";
        let val = this.value_at_time(mouse_time);
        if (typeof val !== "undefined") {
            val_string = val_string + val;
        }

        this.bg_context.save();
        this.bg_context.lineWidth = 1;
        this.bg_context.strokeStyle = "#FFFFFF";
        this.bg_context.beginPath();
        this.bg_context.moveTo(x, 0);
        this.bg_context.lineTo(x, this.bg_canvas.height);
        this.bg_context.stroke();
        this.fg_context.closePath();

        this.bg_context.fillStyle = "#FFFFFF";
        this.bg_context.font = "20px sans-serif";

        let pad = 5;

        if (x > this.bg_canvas.width / 2) {
            this.bg_context.textAlign = "right";
            pad = -5;
        }
        else {
            this.bg_context.textAlign = "left";
        }

        this.bg_context.fillText(time_indicator, x + pad, 20);
        this.bg_context.fillText(val_string, x + pad, 40);
        this.bg_context.restore();
    }


    /* Draw each of the small markers indicating that a comment has been left at a given time. */
    draw_comment_blips() {
        this.bg_context.save();

        this.bg_context.fillStyle = "#5533CC";
        this.bg_context.strokeStyle = "#8855EE"

        const slice_comments = _.takeWhile(_.dropWhile(this.comments, (c) => (c.timestamp < this.rendered_time_slice.start)), (c) => (c.timestamp <= this.rendered_time_slice.end));
        let num_displayed_comments = 0;
        for (let comment of slice_comments) {
            this.bg_context.beginPath();
            const x = this.timestamp_to_screen_space(comment.timestamp);
            this.bg_context.arc(x, this.bg_canvas.height, this.comment_blip_radius, Math.PI, 0);
            this.bg_context.fill();
            this.bg_context.stroke();

            const mouse_dist = Math.abs(this.mouse_x - x);
            if (this.mouse_on_canvas && mouse_dist <= this.comment_max_dist) {
                this.draw_comment(comment, mouse_dist, num_displayed_comments);
                num_displayed_comments++;
            }
            this.bg_context.closePath();
        }

        this.bg_context.restore();
    }


    /* Draw a single comment, becoming more prominent as distance approaches 0. */
    draw_comment(comment, distance, index) {
        this.bg_context.save()
        const opacity = this.ease_interp(0, 1, Math.min((this.comment_max_dist - distance) / (this.comment_max_dist - this.comment_min_dist), 1));
        const elevation = this.bg_canvas.height - this.comment_min_height - (this.comment_max_height - this.comment_min_height)*opacity*(index+1);

        this.bg_context.textAlign = "center";
        this.bg_context.fillStyle = "rgba(255, 255, 255, " + opacity + ")";
        this.bg_context.font = "18px sans-serif";
        let font_height = 18*1.5
        let text = comment.author + ": \"" + comment.text + "\""
        let text_width = this.bg_context.measureText(text).width
        const x = Math.min(this.bg_canvas.width - text_width/2, Math.max(text_width/2,this.timestamp_to_screen_space(comment.timestamp)));
        this.bg_context.fillText(text, x, elevation);
        this.bg_context.restore()
    }


    /* Draw the last milliseconds of the worm, padding with space for
     * pad_milliseconds worth of imaginary data on the right hand side.
     * If the region exceeds the available data, the worm should draw from left
     * to right until it reaches the right border, minus padding,
     * and then it should scroll. */
    draw_end(milliseconds, pad_milliseconds) {
        const worm_start_time = this.data[0].timestamp;
        const worm_end_time = this.data[this.data.length - 1].timestamp;

        const serv_time = this.approx_server_time()
        const start = Math.max(worm_start_time, serv_time - milliseconds);
        const end = Math.max(worm_start_time + milliseconds, serv_time) + pad_milliseconds;

        this.rendered_time_slice.start = start;
        this.rendered_time_slice.end = end;

        this.draw_slice(start, end, this.display_range, this.y_offset_pixels);
    }


    /* Draw a slice of the worm between time_start and time_end, to fill up
     * the canvas horizontally.
     * If time_end exceeds the length of the worm data, empty space will be
     * rendered past the end. */
    draw_slice(time_start, time_end, value_range, y_offset_pixels) {
        // Set up the styles.
        this.fg_context.save();
        this.fg_context.beginPath();
        this.fg_context.strokeStyle = this.worm_style;
        this.fg_context.lineWidth = this.thickness;
        this.fg_context.lineCap = 'round';
        // Change lineJoin to "round" for rounder corners.
        this.fg_context.lineJoin = 'bevel';

        // Draw the part of the worm that fits in the camera.
        const slice = this.time_slice(time_start, time_end);

        // Initialise the first point to the first datum in the range or else 0.
        let x = (slice.length > 0) ? this.timestamp_to_screen_space(slice[0].timestamp) : 0;
        let y = (slice.length > 0) ? this.value_to_screen_space(slice[0].value, value_range, y_offset_pixels) : 0;
        this.fg_context.moveTo(x, y);

        //const stride = Math.max(1, Math.ceil(slice.length / this.max_render_segments));
        // TODO: in order to fix this, move the slice indices to multiples of the stride,
        //       otherwise the worm wiggles unpleasantly. Also always render the endpoints.
        const stride = 1
        // Draw the actual body of the worm.
        for (let i = 0; i < slice.length - stride; i += stride) {
            const point = slice[i];
            const next_point = slice[i+stride];

            x = this.timestamp_to_screen_space(point.timestamp);
            y = this.value_to_screen_space(point.value, value_range, y_offset_pixels);
            let next_x = this.timestamp_to_screen_space(next_point.timestamp);
            let next_y = this.value_to_screen_space(next_point.value, value_range, y_offset_pixels);
            let mid = {x: (x + next_x)/2, y: (y + next_y)/2};

            this.draw_segment(x, y, mid.x, mid.y);
        }
        this.fg_context.stroke();
        this.fg_context.closePath();

        // The last worm segment interpolates smoothly between data points.
        // We achieve this by hiding the last this.buffer_duration milliseconds before the present time of worm data.
        let clear_x = this.timestamp_to_screen_space(this.end_time());
        this.fg_context.clearRect(clear_x, 0, this.fg_canvas.width + clear_x, this.fg_canvas.height)

        this.fg_context.restore();
    }

    /* Generate a gradient ranging over worm-value space, where the provided value has maximum magnitude. */
    gradient_over_range() {
        const above = this.value_to_screen_space(this.max_magnitude, this.display_range, 0);
        const below = this.value_to_screen_space(-this.max_magnitude, this.display_range, 0);
        return this.fg_context.createLinearGradient(0, above, 0, below);
    }

    /* Given an object containing style directives, update the worm render settings. */
    set_style(style) {
        // If the argument is "quadratic", smooth the worm out nicely.
        // Otherwise worm segments will be straight lines between data points.
        if (style.hasOwnProperty("smoothing")) {
            if (style.smoothing === "quadratic") {
                this.draw_segment = (x, y, mx, my) => {this.fg_context.quadraticCurveTo(x, y, mx, my)}
            }
            else {
                this.draw_segment = (x, y, mx, my) => {this.fg_context.lineTo(x, y)}
            }
        }

        // Draw the worm with a nice gradient.
        if (style.hasOwnProperty("gradient")) {
            if (style.gradient === true) {
                this.worm_style = this.gradient_over_range();
                this.worm_style.addColorStop(0, "rgb(0,255,100)");
                this.worm_style.addColorStop(0.2, "rgb(0,255,0)");
                this.worm_style.addColorStop(0.5, "rgb(200,200,0)");
                this.worm_style.addColorStop(0.8, "rgb(255,0,0)");
                this.worm_style.addColorStop(1, "rgb(180,0,0)");
            }
            else {
                this.set_style({"color": "red"})
            }
        }

        // Draw the worm with a solid colour.
        if (style.hasOwnProperty("color")) {
            this.worm_style = style.color;
        }

        // Draw a glowing effect on the worm.
        if (style.hasOwnProperty("glow")) {
            if (style.glow) {
                this.fg_context.shadowBlur = 10;
                this.fg_context.shadowColor = style.glow;
            }
            else {
                this.fg_context.shadowBlur = 0;
            }
        }

        // Set the thickness of the worm.
        if (style.hasOwnProperty("thickness")) {
            this.thickness = style.thickness;
        }

        // Rainbow mode makes the worm pulsate rainbow colours.
        // If the value of rainbow is numeric, it sets the frequency.
        if (style.hasOwnProperty("rainbow")) {
            if (style.rainbow === false) {
                if (this.update_functions.rainbow) {
                    delete this.update_functions.rainbow;
                    this.set_style({gradient: true});
                }
            }
            else if (style.rainbow === true) {
                this.set_style({rainbow: 0.5});
            }
            else {
                /* Set the worm's colour depending on the current time step and the given frequency. */
                const freq = style.rainbow;
                if (freq > 0) {
                    this.update_functions.rainbow = () => {
                                this.set_style({color: "hsl(" + (this.prev_tick * freq * 360 / 1000) % 360 + ", 90%, 60%)"})
                    };
                }
                else {
                    this.update_functions.rainbow = () => {
                                let color_arg = (this.prev_tick * freq * 360 / 1000)
                                this.set_style({color: "hsl(" + color_arg % 360 + ", 90%, 60%)",
                                                glow: "hsl(" + (color_arg + 90) % 360 + ", 90%, 60%)"});
                    };
                }
            }
        }

        // Draw Luke Anderson.
        if (style.hasOwnProperty("luke")) {
            if (style.luke === true) {
                this.render_functions.luke = this.draw_luke;
            }
            else if (style.luke === false) {
                if (this.render_functions.luke) {
                    delete this.render_functions.luke;
                }
            }
        }

        // Draw lots of exciting effects.
        if (style.hasOwnProperty("party")) {
            if (style.party == true) {
                this.set_style({luke: true, rainbow: -2, thickness: 8});
                this.demo_mode(true);
            }
            else {
                this.set_style({luke: false, rainbow: false, thickness: 2, gradient: true, glow: false});
                this.demo_mode(false);
            }
        }

    }


   /* Draw a nice little spinning Luke. */
   draw_luke() {
        this.fg_context.save();
        let base_image = new Image();
        base_image.src = 'http://i.imgur.com/PGSwOSh.png';
        let end_time = this.end_time();

        let x = this.timestamp_to_screen_space(end_time);
        let val = this.value_at_time(end_time);
        let y = this.value_to_screen_space(val ? val : 0, this.display_range, 0);
        this.fg_context.translate(x, y);
        this.fg_context.rotate(2*Math.sin(Date.now()/500)*Math.PI);
        let scale_val = ((-Date.now() % 500) / 500) + 2;
        this.fg_context.scale(scale_val, scale_val);
        this.fg_context.drawImage(base_image, -50, -50, 100, 100);
        this.fg_context.restore();
    }


    /* Generate fake data. */
    demo_mode(activated) {
        if (activated) {
            this.update_functions.add_fake_point = this.add_fake_point;
            this.update_functions.add_fake_comment = this.add_fake_comment;
        } else {
            delete this.update_functions.add_fake_point;
            delete this.update_functions.add_fake_comment;
        }
    }


/* ==================== Utilities ==================== */


    /* Return the approximate server time. */
    approx_server_time() {
        return Date.now() + this.serv_time_diff;
    }


    /* Map linearly from the range [0,1] to [x1, x2]. */
    lerp(x1, x2, t) {
        return x1 + t*(x2 - x1);
    }


    /* Interpolate between x1 and x2 with a sinusoidal ease-in and ease-out. */
    ease_interp(x1, x2, t) {
        return this.lerp(x1, x2, Math.sin(t * Math.PI / 2));
    }


    /* Given a duration in milliseconds, return the equivalent H*:MM:SS string */
    hours_mins_secs_string(d) {
        const sign = Math.sign(d);
        d *= sign;
        const seconds = Math.floor((d / 1000) % 60);
        const minutes = Math.floor((d / (60 * 1000)) % 60);
        const hours = Math.floor((d / (60 * 60 * 1000)));
        const is_zero = seconds + minutes + hours;
        const str_sign = sign*is_zero >= 0 ? "" : "-";
        return str_sign +
               (hours > 0 ? hours + ":" : "") +
               (minutes < 10 ? "0" : "") + minutes + ":" +
               (seconds < 10 ? "0" : "") + seconds;
    }


    /* Given a duration in milliseconds, return the equivalent H*:MM:SS string */
    hours_mins_secs_string(d) {
        const sign = Math.sign(d);
        d *= sign;
        const seconds = Math.floor((d / 1000) % 60);
        const minutes = Math.floor((d / (60 * 1000)) % 60);
        const hours = Math.floor((d / (60 * 60 * 1000)));
        const is_zero = seconds + minutes + hours;
        const str_sign = sign*is_zero >= 0 ? "" : "-";
        return str_sign +
               (hours > 0 ? hours + ":" : "") +
               (minutes < 10 ? "0" : "") + minutes + ":" +
               (seconds < 10 ? "0" : "") + seconds;
    }


        /* A function to add fake data points to the worm that will vary handsomely. */
    add_fake_point() {

        if (typeof this.last_updated == "undefined") {
            this.last_updated = 0;
        }
        this.update_delay = 150;
        const now = Date.now();

        if (now - this.last_updated > this.update_delay) {
            const vote_trend_duration_duration = 60000;
            const vote_trend_duration = 4000*(2.5*Math.sin(this.prev_tick / vote_trend_duration_duration) + 0.5);
            const trend = Math.cos(this.prev_tick / vote_trend_duration);
            const vote_total = this.data[this.data.length - 1].value + (this.random_users * this.lerp(2 * Math.random() - 1, trend, 0.15));
            this.push_data(vote_total, this.prev_tick + (Math.random() - 0.5) * this.update_delay);
            this.last_updated = now;
        }
    }


    /* A function to add a fake comment every little while. */
    add_fake_comment() {
        if (!this.comment_delay) {
            this.comment_delay = 5000;
        }

        if (!this.next_comment_time) {
            this.next_comment_time = this.approx_server_time() + 5000;
        }

        const now = this.approx_server_time();
        if (now > this.next_comment_time) {
            this.push_comment("Boo Sucks", "Your mother was a great big black dog and I hated her guts, you idiot.", now);
            this.next_comment_time = now + (1.2*Math.random() + 0.5)*this.comment_delay;
        }
    };


    /* Return the slice of the worm falling within a given time range. */
    time_slice(time_start, time_end) {
        let start_index = Math.max(0, _.findLastIndex(this.data, (t) => {return t.timestamp < time_start}));
        let end_index = _.findIndex(this.data, (t) => {return t.timestamp > time_end});
        end_index = (end_index < 0) ? this.data.length : end_index + 2; // +2 just a hack so it actually meets the rightmost boundary.
        return this.data.slice(start_index, end_index);
    }


    /* Return the timestamp of the last rendered worm point. */
    end_time() {
        return this.approx_server_time() - this.buffer_duration;
    }


    /* Takes a unix timestamp and returns the x position on screen it renders at. */
    timestamp_to_screen_space(t) {
        const screen_x_fraction = (t - this.rendered_time_slice.start) / this.rendered_time_slice.duration();
        return screen_x_fraction * this.fg_canvas.width;
    }


    /* Take a screen space coordinate and return the timestamp it represents. */
    screen_space_to_timestamp(x) {
        const screen_x_fraction = x / this.fg_canvas.width;
        return (screen_x_fraction * this.rendered_time_slice.duration()) + this.rendered_time_slice.start;
    }


    /* Given an absolute worm value, and the magnitude of the range it should
     * be rendered in, return the vertical position it would be rendered at. */
    value_to_screen_space(val, range, offset_pixels) {
        return (-val * this.fg_canvas.height / (range * 2)) + (this.fg_canvas.height / 2) + offset_pixels;
    }


    /* At a timestamp t, return the value of the worm at that time, if it exists. */
    value_at_time(t) {
        const prior = _.findLast(this.data, (e) => {return e.timestamp <= t});
        const posterior = _.find(this.data, (e) => {return e.timestamp >= t && e.timestamp <= this.end_time() + 1000});
        if (prior && posterior) {
            let fractional_position = (t - prior.timestamp) / (posterior.timestamp - prior.timestamp);
            return Math.round(this.lerp(prior.value, posterior.value, fractional_position));
        }
    }


}
