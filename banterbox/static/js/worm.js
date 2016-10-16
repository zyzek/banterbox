// TODO: Fix worm gradient when y offset is applied.
// TODO: Move worm style stuff into the set_worm_style() function.
// TODO: Improve draw_worm_end tracking to be more robust to slow worm updates.
//       E.G. buffer, don't keep scrolling to Date.now() if too far past worm end
// TODO: If worm updates lag behind current time, move the clearing rectangle back
//       to make it catch up to realtime faster, and not be jerky
// TODO: give the worm an end cap now that we're just lopping it.
// TODO: Comment rendering.
// TODO: scrolling + zooming when not tracking

class Worm {


    constructor(container_fg, container_bg) {
        this.fg_canvas = container_fg;
        this.fg_context = this.fg_canvas.getContext('2d');
        this.fg_canvas.width = window.innerWidth;
        this.fg_canvas.height = window.innerHeight;
        this.bg_canvas = container_bg;
        this.bg_context = this.bg_canvas.getContext('2d');
        this.bg_canvas.width = window.innerWidth;
        this.bg_canvas.height = window.innerHeight;

        // Make the canvas resize with the window.
        window.addEventListener('resize', () => {
            this.fg_canvas.width = window.innerWidth;
            this.fg_canvas.height = window.innerHeight;
            this.bg_canvas.width = window.innerWidth;
            this.bg_canvas.height = window.innerHeight;

            this.set_worm_style({gradient: "mood"})
        });

        // Zoom the time slice viewed when the mouse wheel is scrolled.
        this.fg_canvas.addEventListener('wheel', (event) => {
            if (this.mouse_on_canvas) {
                this.render_duration *= Math.pow(1.01, event.deltaY);
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
        this.fg_canvas.addEventListener('mousemove', (event) => {this.mouse_x = event.clientX;});

        const now = Date.now();

        // The actual worm data itself.
        this.data = [{value: 0, timestamp: now - 100, received: now - 100}, {value: 0, timestamp: now, received: now}];

        // Render the last render_duration milliseconds.
        this.render_duration = 20000;
        // Defines the size of empty space on the right side of the worm.
        this.pad_duration = 0;
        // Defines a buffer of updates not to be rendered.
        this.buffer_duration = 2000;
        // Defines the maximum number of worm segments to render.
        this.max_render_segments = 100;
        // Whether to automatically track the end of the worm or not.
        this.auto_track = true;

        // Timer information
        this.prev_tick = now;
        this.delta = 0;
        this.update_delay = 150;
        this.last_updated = now;
        this.start_timestamp = now;

        // Used for vertical scaling.
        this.worm_range = 150;
        this.rescale_target_range = 150;
        this.rescale_start_range = 150;
        this.rescale_start_time = now;
        this.rescale_duration = 0;
        this.rescaling = false;
        this.y_offset_pixels = 0;
        this.auto_rescale = true;

        // Camera
        this.rendered_time_slice = {start: 0,
                                end:10,
                                duration: () => {return this.rendered_time_slice.end - this.rendered_time_slice.start},
                                pixels_per_millisecond: () => { return this.fg_canvas.width / this.rendered_time_slice.duration()}
                               }
        this.interp_point = {timestamp: 0, value: 0, received: 0};

        // Used for fake data generation (but could be handy at some point)
        this.users = 50;

        // Render settings and parameters.
        this.worm_thickness = 1;
        this.set_worm_style({smoothing: "quadratic",
                             gradient: "mood",
                             thickness: 4});

        // Set up functions to run every update step.
        this.update_functions = {};

        /* Function to add a fake data point to the end of the worm every update_delay milliseconds. */
        this.add_fake_point = () => {
            if (Date.now() - this.last_updated > this.update_delay) {
                const vote_trend_duration = 3000;
                const trend = Math.cos(this.prev_tick / vote_trend_duration);
                const vote_total = this.data[this.data.length - 1].value + (this.users * this.lerp(2 * Math.random() - 1, trend, 0.15));

                if (this.auto_rescale && (Math.abs(vote_total) * 1.2 > this.worm_range)) {
                    const overshoot_ratio = Math.abs(vote_total)/this.worm_range;
                    this.rescale_worm_to(this.worm_range * 1.2, 500/overshoot_ratio);
                }

                this.push_data(vote_total, this.prev_tick + (Math.random() - 0.5) * this.update_delay);
            }
        };

        // Generate fake data.
        this.update_functions.add_fake_point = this.add_fake_point;

        // RELEASE THE WORM
        this.run = this.run.bind(this);
        this.run()
    }


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
        this.draw_time_slice_indicators();

        if (this.mouse_on_canvas) {
            this.draw_mouse_line(this.mouse_x);
        }

        this.fg_context.clearRect(0, 0, this.fg_canvas.width, this.fg_canvas.height);
        if (this.auto_track) {
            this.draw_worm_end(this.render_duration, this.pad_duration);
        }
        else {
            this.draw_worm_slice(this.rendered_time_slice.start, this.rendered_time_slice.end, this.worm_range, this.y_offset_pixels);
        }

        this.smooth_rescale_worm()
    }


    /* Update the state of the worm by a tick. */
    update() {
        const now = Date.now();
        this.delta = now - this.prev_tick;
        this.prev_tick = now;

        Object.keys(this.update_functions).forEach((key) => {this.update_functions[key]()})
    }


    /* Push a new data point to the end of the worm. */
    push_data(val, ts) {
        this.last_updated = Date.now();
        this.data.push({value: val, timestamp: ts, received: this.last_updated});
    }


    /* Map linearly from the range [0,1] to [x1, x2]. */
    lerp(x1, x2, t) {
        return x1 + t*(x2 - x1);
    }


    /* Interpolate between x1 and x2 with a sinusoidal ease-in and ease-out. */
    ease_interp(x1, x2, t) {
        return this.lerp(x1, x2, Math.sin(t * Math.PI / 2));
    }


    /* Initiate a rescale of the worm to target_range over duration milliseconds. */
    rescale_worm_to(target_range, duration) {
        this.rescale_start_time = Date.now();
        this.rescale_start_range = this.worm_range;
        this.rescale_target_range = target_range;
        this.rescale_duration = duration;
        this.rescaling = true;
    }


    /* Smoothly perform one step of an active rescale, and disable scaling once
       the interpolation is complete. */
    smooth_rescale_worm() {
        const now = Date.now();

        if (this.rescale_start_time + this.rescale_duration < now) {
            this.rescaling = false;
        }

        if (this.rescaling) {
            const fraction_elapsed = (now - this.rescale_start_time) / this.rescale_duration;
            this.worm_range = this.ease_interp(this.rescale_start_range, this.rescale_target_range, fraction_elapsed);
        }
    }


    /* Draw a horizontal rule denoting the 0 vote level. */
    draw_zero_line() {
        this.bg_context.save();
        this.bg_context.beginPath();
        this.bg_context.lineWidth = 1;
        this.bg_context.strokeStyle = "#777777";
        let zero_height = this.value_to_screen_space(0, this.worm_range, this.y_offset_pixels);
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
        const mouse_time = this.screen_space_to_timestep(x)
        const time_indicator = this.hours_mins_secs_string(mouse_time - this.start_timestamp);
        const prior = _.findLast(this.data, (e) => {return e.timestamp <= mouse_time});
        const posterior = _.find(this.data, (e) => {return e.timestamp >= mouse_time && e.timestamp < Date.now() - this.buffer_duration});

        let val_string = ""
        if (prior && posterior) {
            let fractional_position = (mouse_time - prior.timestamp) / (posterior.timestamp - prior.timestamp);
            val_string = "" + Math.round(this.lerp(prior.value, posterior.value, fractional_position));
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


    /* Draw the last num_points points of the worm, padding with space for
     * end_pad_size imaginary points on the right hand side.
     * If num_points exceeds the available data, the worm should draw from left
     * to right until it reaches the right border, minus padding,
     * and then it should scroll. */
    draw_worm_end(milliseconds, pad_milliseconds) {
        const worm_start_time = this.data[0].timestamp;
        const worm_end_time = this.data[this.data.length - 1].timestamp;

        // If the worm starts getting out of sync, it's possible to replace Date.now() with this.interp_point.timestamp
        const start = Math.max(worm_start_time, Date.now() - milliseconds);
        const end = Math.max(worm_start_time + milliseconds, Date.now()) + pad_milliseconds;

        this.rendered_time_slice.start = start;
        this.rendered_time_slice.end = end;

        this.draw_worm_slice(start, end, this.worm_range, this.y_offset_pixels);
    }


    /* Draw a slice of the worm between time_start and time_end, to fill up
     * the canvas horizontally.
     * If time_end exceeds the length of the worm data, empty space will be
     * rendered past the end. */
    draw_worm_slice(time_start, time_end, value_range, y_offset_pixels) {
        // Set up the styles.
        this.fg_context.save();
        this.fg_context.beginPath();
        this.fg_context.strokeStyle = this.worm_style;
        this.fg_context.lineWidth = this.worm_thickness;
        this.fg_context.lineCap = 'round';
        // Change lineJoin to "round" for rounder corners.
        this.fg_context.lineJoin = 'bevel';

        // Draw the part of the worm that fits in the camera.
        let start_index = Math.max(0, _.findLastIndex(this.data, (t) => {return t.timestamp < time_start}));
        let end_index = _.findIndex(this.data, (t) => {return t.timestamp > time_end});
        end_index = (end_index < 0) ? this.data.length : end_index + 2; // +2 just a hack so it actually meets the right boundary.
        const slice = this.data.slice(start_index, end_index);

        // Initialise the first point to the first datum in the range or else 0.
        let x = (slice.length > 0) ? this.timestep_to_screen_space(slice[0].timestamp) : 0;
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

            x = this.timestep_to_screen_space(point.timestamp);
            y = this.value_to_screen_space(point.value, value_range, y_offset_pixels);
            let next_x = this.timestep_to_screen_space(next_point.timestamp);
            let next_y = this.value_to_screen_space(next_point.value, value_range, y_offset_pixels);

            let mid = {x: (x + next_x)/2, y: (y + next_y)/2};

            this.draw_segment(x, y, mid.x, mid.y);
        }

        this.fg_context.stroke();
        this.fg_context.closePath();

        // The last worm segment interpolates smoothly between data points.
        // We achieve this by hiding the last this.buffer_duration milliseconds before the present time of worm data.
        this.fg_context.clearRect(this.timestep_to_screen_space(Date.now() - this.buffer_duration), 0, this.fg_canvas.width, this.fg_canvas.height)
        this.fg_context.restore();
    }


    /* The proportion of the last update step that has been rendered.
     *  E.g. If the time between the last two updates was 100 milliseconds,
     *  and 50 milliseconds has passed since the last update, return 0.5. */
    update_fraction_elapsed() {
        const last_update_delta = this.data[this.data.length - 1].timestamp - this.data[this.data.length - 2].timestamp
        const time_since_update = Date.now() - this.data[this.data.length - 1].received;
        return time_since_update / last_update_delta;
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


    /* Takes a unix timestep and returns the x position on screen it renders at. */
    timestep_to_screen_space(t) {
        const screen_x_fraction = (t - this.rendered_time_slice.start) / this.rendered_time_slice.duration();
        return screen_x_fraction * this.fg_canvas.width;
    }


    /* Take a screen space coordinate and return the timestep it represents. */
    screen_space_to_timestep(x) {
        const screen_x_fraction = x / this.fg_canvas.width;
        return (screen_x_fraction * this.rendered_time_slice.duration()) + this.rendered_time_slice.start;
    }


    /* Given an absolute worm value, and the magnitude of the range it should
     * be rendered in, return the vertical position it would be rendered at. */
    value_to_screen_space(val, range, offset_pixels) {
        return (-val * this.fg_canvas.height / (range * 2)) + (this.fg_canvas.height / 2) + offset_pixels;
    }


    /* Given an object containing style directives, update the worm render settings. */
    set_worm_style(style) {
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
            if (style.gradient === "mood") {
                this.worm_style = this.fg_context.createLinearGradient(0, 0, 0, this.fg_canvas.height);
                this.worm_style.addColorStop(0, "rgb(0,255,100)");
                this.worm_style.addColorStop(0.2, "rgb(0,255,0)");
                this.worm_style.addColorStop(0.5, "rgb(200,200,0)");
                this.worm_style.addColorStop(0.8, "rgb(255,0,0)");
                this.worm_style.addColorStop(1, "rgb(180,0,0)");
            }
            else {
                this.set_worm_style({gradient: "mood"})
            }
        }

        // Draw the worm with a solid colour.
        if (style.hasOwnProperty("color")) {
            this.worm_style = style.color;
        }

        // Set the thickness of the worm.
        if (style.hasOwnProperty("thickness")) {
            this.worm_thickness = style.thickness;
        }

        // Rainbow mode makes the worm pulsate rainbow colours.
        // If the value of rainbow_mode is numeric, it sets the frequency.
        if (style.hasOwnProperty("rainbow_mode")) {
            if (style.rainbow_mode === false) {
                if (this.update_functions.rainbow) {
                    delete this.update_functions.rainbow;
                    this.set_worm_style({gradient: "mood"});
                }
            }
            else if (style.rainbow_mode === true) {
                this.set_worm_style({rainbow_mode: 0.5});
            }
            else {
                /* Set the worm's colour depending on the current timestep and the given frequency. */
                const freq = style.rainbow_mode;
                this.update_functions.rainbow = () => {this.set_worm_style({color: "hsl(" + (this.prev_tick * freq * 360 / 1000) % 360 + ", 90%, 60%)"})};
            }
        }
    }


}
