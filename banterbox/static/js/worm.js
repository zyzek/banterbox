// TODO: Fix worm gradient when y offset is applied.
// TODO: Quadratic curves for worm smoothing.

class Worm {
    constructor(container) {
        this.canvas = container
        this.context = this.canvas.getContext('2d')
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Make the canvas resize with the window.
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        })

        // The actual worm data itself.
        this.data = [{y: 0, ts: Date.now()}, {y: 0, ts: Date.now()}];

        // Render the last render_duration milliseconds.
        this.render_duration = 10000;
        // Defines the size of empty space on the right side of the worm.
        this.pad_duration = 2000;

        // Timer information
        this.prev_tick = Date.now();
        this.delta = 0;
        this.update_timer = 0;
        this.update_delay = 150;

        // Used for vertical scaling.
        this.worm_range = 150;
        this.rescale_target_range = 150;
        this.rescale_start_range = 150;
        this.rescale_start_time = Date.now();
        this.rescale_duration = 0;
        this.rescaling = false;
        this.y_offset_pixels = 0;
        this.auto_rescale = true;

        // Camera
        this.draw_time_slice = {start: 0,
                                end:10,
                                pixels_per_millisecond: () => { return this.canvas.width / (this.draw_time_slice.end - this.draw_time_slice.start)}
                               }
        this.interp_point = {ts: 0, y: 0};

        // Used for fake data generation (but could be handy at some point)
        this.users = 50;

        // Render settings and parameters.
        this.worm_grad = this.context.createLinearGradient(0, 0, 0, this.canvas.height);
        this.worm_grad.addColorStop(0, "rgb(0,255,100)");
        this.worm_grad.addColorStop(0.2, "rgb(0,255,0)");
        this.worm_grad.addColorStop(0.5, "rgb(200,200,0)");
        this.worm_grad.addColorStop(0.8, "rgb(255,0,0)");
        this.worm_grad.addColorStop(1, "rgb(180,0,0)");

        this.context.fillStyle = "rgb(239, 5, 239)";
        this.context.strokeStyle = "rgb(239, 5, 239)";
        this.context.lineWidth = 10;

        // RELEASE THE WORM
        this.run = this.run.bind(this);
        this.run()
    }


    /* The main loop.
     * This runs only when the window has focus. */
    run() {
        this.delta = Date.now() - this.prev_tick;
        this.prev_tick += this.delta;
        this.update();
        this.render();
        requestAnimationFrame(this.run);
    }


    /* Draw a frame */
    render() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw_zero_line();
        this.draw_worm_end(this.render_duration, this.pad_duration);
        this.smooth_rescale_worm()
    }


    /* Update the state of the worm by a tick. */
    update() {
        // Add a fake data point to the end of the worm every update_delay milliseconds
        this.update_timer += this.delta;
        if (this.update_timer > this.update_delay) {
            this.update_timer = 0;

            const vote_trend_duration = 3000;
            const trend = Math.cos(Date.now() / vote_trend_duration);
            const vote_total = this.data[this.data.length - 1].y + (this.users * this.lerp(2 * Math.random() - 1, trend, 0.15));

            if (this.auto_rescale && (Math.abs(vote_total) * 1.2 > this.worm_range)) {
                const overshoot_ratio = Math.abs(vote_total)/this.worm_range;
                this.rescale_worm_to(this.worm_range * 1.2, 500/overshoot_ratio);
            }

            this.push_data(vote_total, Date.now() + (Math.random() - 0.5) * this.update_delay);
        }
    }


    /* Push a new data point to the end of the worm. */
    push_data(val, timestamp) {
        this.data.push({y: val, ts: timestamp});
    }


    /* Given an absolute worm value, and the magnitude of the range it should
     * be rendered in, return the vertical position it would be rendered at. */
    scale_worm_height(val, range, offset_pixels) {
        return (val * this.canvas.height / (range * 2)) + (this.canvas.height / 2) + offset_pixels;
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


    /* The proportion of the last update step that has been rendered.
     *  E.g. If the time between the last two updates was 100 milliseconds,
     *  and 50 milliseconds has passed since the last update, return 0.5. */
    update_fraction_elapsed() {
        const update_delay = this.data[this.data.length - 1].ts - this.data[this.data.length - 2].ts
        return Math.max(0, Math.min(this.update_timer / update_delay, 1));
    }


    /* Draw a horizontal rule denoting the 0 vote level. */
    draw_zero_line() {
        this.context.save();
        this.context.beginPath();
        this.context.lineWidth = 1;
        this.context.strokeStyle = "#777777";
        let zero_height = this.scale_worm_height(0, this.worm_range, this.y_offset_pixels);
        this.context.moveTo(0, zero_height);
        this.context.lineTo(this.canvas.width, zero_height);
        this.context.stroke();
        this.context.restore();
    }


    /* Draw the last num_points points of the worm, padding with space for
     * end_pad_size imaginary points on the right hand side.
     * If num_points exceeds the available data, the worm should draw from left
     * to right until it reaches the right border, minus padding,
     * and then it should scroll. */
    draw_worm_end(milliseconds, pad_milliseconds) {
        const worm_start_time = this.data[0].ts;
        const worm_end_time = this.data[this.data.length - 1].ts;
        const start = Math.max(worm_start_time, this.interp_point.ts - milliseconds)
        const end = Math.max(worm_start_time + milliseconds, this.interp_point.ts) + pad_milliseconds;

        this.draw_time_slice.start = start;
        this.draw_time_slice.end = end;

        this.draw_worm_slice(start, end, this.worm_range, this.y_offset_pixels);
    }


    /* Draw a slice of the worm between time_start and time_end, to fill up
     * the canvas horizontally.
     * If time_end exceeds the length of the worm data, empty space will be
     * rendered past the end. */
    draw_worm_slice(time_start, time_end, y_range, y_offset_pixels) {
        // Set up the styles.
        this.context.beginPath();
        this.context.strokeStyle = this.worm_grad;
        this.context.lineWidth = 4;
        this.context.lineCap = 'round';
        // Change lineJoin to "round" for rounder corners.
        this.context.lineJoin = 'bevel';

        // Draw the part of the worm that fits in the camera.
        let start_index = Math.max(0, _.findLastIndex(this.data, (t) => {return t.ts < time_start}));
        let end_index = _.findIndex(this.data, (t) => {return t.ts > time_end});
        end_index = (end_index < 0) ? this.data.length : end_index;
        const slice = this.data.slice(start_index, end_index);

        // Initialise the first point to the first datum in the range or else 0.
        let x = (slice.length > 0) ? slice[0].ts : 0;
        let y = (slice.length > 0) ? this.scale_worm_height(slice[0].y) : 0;
        this.context.moveTo(x, y);

        // Draw the actual body of the worm.
        for (let i = 0; i < slice.length - 1; ++i) {
            const point = slice[i];
            const next_point = slice[i+1];

            let prev_x = x;
            let prev_y = y;

            x = this.timestep_to_screen_space(point.ts);
            y = this.scale_worm_height(point.y, y_range, y_offset_pixels);

            let next_x = this.timestep_to_screen_space(next_point.ts);
            let next_y = this.scale_worm_height(next_point.y, y_range, y_offset_pixels);

            let mid = {x: (x + next_x)/2, y: (y + next_y)/2};

            //this.context.lineTo(x, y);
            this.context.quadraticCurveTo(x, y, mid.x, mid.y);
        }

        // The last worm segment interpolates smoothly between data updates.
        if (slice[slice.length - 1].ts >= this.data[this.data.length - 1].ts){
            const update_fraction = this.update_fraction_elapsed();
            const ult = slice[slice.length - 1];
            const penult = slice[slice.length - 2];
            this.interp_point.ts = this.lerp(penult.ts, ult.ts, update_fraction);
            this.interp_point.y = this.lerp(penult.y, ult.y, update_fraction);
            this.context.lineTo(this.timestep_to_screen_space(this.interp_point.ts),
                                this.scale_worm_height(this.interp_point.y, y_range, y_offset_pixels));
        }

        this.context.stroke();
        this.context.closePath();
    }


    timestep_to_screen_space(t) {
        const width = this.draw_time_slice.end - this.draw_time_slice.start;
        const screen_x = (t - this.draw_time_slice.start) / width;
        return screen_x * this.canvas.width;
    }
}
