// TODO: Fix worm gradient when y offset is applied.
// TODO: Dynamically handle varying update delays, convert to temporal rather than ordinal logic.
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
        this.data = [{y: 0, ts: Date.now()}];

        // Maximum number of worm segments to draw.
        this.max_worm_length = 100;

        // Defines the size of empty space on the right side of the worm.
        this.worm_right_pad = 20;

        // Timer information
        this.old_time = Date.now();
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
        this.delta = Date.now() - this.old_time
        this.old_time += this.delta
        this.update()
        this.render()
        requestAnimationFrame(this.run)
    }


    /* Draw a frame */
    render() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw_zero_line();
        this.draw_worm_end(this.max_worm_length, this.worm_right_pad);
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

            this.push_data(vote_total, Date.now());
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

    rescale_worm_to(target_range, duration) {
        this.rescale_start_time = Date.now();
        this.rescale_start_range = this.worm_range;
        this.rescale_target_range = target_range;
        this.rescale_duration = duration;
        this.rescaling = true;
    }

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
        return this.update_timer / this.update_delay;
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
    draw_worm_end(num_points, end_pad_size) {
        const start = Math.max(0, (this.data.length - 1) - num_points);
        const end = Math.max(num_points + end_pad_size, this.data.length - 1 + end_pad_size);
        const x_offset = num_points > this.data.length - 1 ? 0 : (this.canvas.width / (start - end - 1)) * this.update_fraction_elapsed();
        this.draw_worm_slice(start, end, x_offset, this.worm_range, this.y_offset_pixels);
    }


    /* Draw a slice of the worm between x_start and x_end, to fill up the canvas
     * horizontally.
     * x_offset_pixels will displace the drawing of the worm, which is used for
     * smooth scrolling.
     * If x_end exceeds the length of the worm data, empty space will be
     * rendered past the end. */
    draw_worm_slice(x_start, x_end, x_offset_pixels, y_range, y_offset_pixels) {
        // Set up the styles.
        this.context.beginPath();
        this.context.strokeStyle = this.worm_grad;
        this.context.lineWidth = 4;
        this.context.lineCap = 'round';
        // Change lineJoin to "round" for rounder corners.
        this.context.lineJoin = 'bevel';

        // The distance between individual worm segments.
        let segment_width = this.canvas.width / (x_end - x_start);
        let update_fraction = this.update_fraction_elapsed();

        // Initialise the first point to the first datum in range or else 0.
        let initial = (x_start < this.data.length) ? this.data[x_start] : 0;
        this.context.moveTo(x_offset_pixels, initial);

        let x;
        let y;

        // Draw the actual body of the worm.
        for (let i = x_start; i < x_end && i < this.data.length - 1; ++i) {
            x = (i - x_start) * segment_width;
            y = this.scale_worm_height(this.data[i].y, y_range, y_offset_pixels);
            this.context.lineTo(x + x_offset_pixels, y);
        }

        // The last worm segment interpolates smoothly between data updates.
        if (x_end > this.data.length) {
            let i = this.data.length - 1;
            let last_x = (i - x_start) * segment_width;
            let last_y = this.scale_worm_height(this.data[i].y, y_range, y_offset_pixels);
            x = this.lerp(x, last_x, update_fraction);
            y = this.lerp(y, last_y, update_fraction);
            this.context.lineTo(x + x_offset_pixels, y);
        }

        this.context.stroke();
        this.context.closePath();
    }
}
