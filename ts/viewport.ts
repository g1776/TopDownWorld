interface DragState {
	start: Point;
	end: Point;
	offset: Point;
	active: boolean;
}

class Viewport {
	public ctx: CanvasRenderingContext2D;
	public zoom: number;
	public offset: Point;
	public drag: DragState;
	public center: Point;
	constructor(public canvas: HTMLCanvasElement) {
		this.ctx = canvas.getContext("2d")!;

		this.zoom = Settings.EDITOR_DEFAULT_ZOOM;
		this.center = new Point(canvas.width / 2, canvas.height / 2);
		this.offset = scale(this.center, -1);
		this.drag = {
			start: new Point(0, 0),
			end: new Point(0, 0),
			offset: new Point(0, 0),
			active: false,
		} as DragState;

		this.addEventListeners();
	}

	reset() {
		this.ctx.restore();
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.save();
		this.ctx.translate(this.center.x, this.center.y);
		this.ctx.scale(1 / this.zoom, 1 / this.zoom);
		const offset = this.getOffset();
		this.ctx.translate(offset.x, offset.y);
	}

	getMouse(evt: MouseEvent, subtractDragOffset = false): Point {
		const p = new Point(
			(evt.offsetX - this.center.x) * this.zoom - this.offset.x,
			(evt.offsetY - this.center.y) * this.zoom - this.offset.y
		);

		return subtractDragOffset ? subtract(p, this.drag.offset) : p;
	}

	getOffset() {
		return add(this.offset, this.drag.offset);
	}

	private addEventListeners() {
		this.canvas.addEventListener("wheel", (evt: WheelEvent) => this.handleMouseWheel(evt));
		this.canvas.addEventListener("mousedown", (evt: MouseEvent) => this.handleMouseDown(evt));
		this.canvas.addEventListener("mousemove", (evt: MouseEvent) => this.handleMouseMove(evt));
		this.canvas.addEventListener("mouseup", (evt: MouseEvent) => this.handleMouseUp());
	}

	private handleMouseWheel(evt: WheelEvent) {
		const dir = Math.sign(evt.deltaY);
		this.zoom += dir;

		// clamp between 1 and 5
		this.zoom = Math.max(1, Math.min(5, this.zoom));
	}

	private handleMouseDown(evt: MouseEvent) {
		const MOUSE_WHEEl = 1;
		if (evt.button == MOUSE_WHEEl) {
			this.drag.start = this.getMouse(evt);
			this.drag.active = true;
		}
	}

	private handleMouseMove(evt: MouseEvent) {
		if (this.drag.active) {
			this.drag.end = this.getMouse(evt);
			this.drag.offset = subtract(this.drag.end, this.drag.start);
		}
	}

	private handleMouseUp() {
		if (this.drag.active) {
			this.offset = add(this.offset, this.drag.offset);
			this.drag = {
				start: new Point(0, 0),
				end: new Point(0, 0),
				offset: new Point(0, 0),
				active: false,
			} as DragState;
		}
	}
}
