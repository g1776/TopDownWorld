class StopEditor implements Editor {
	public readonly type: EditorMode = EditorMode.STOP;

	/** The CanvasRenderingContext2D used for drawing on the canvas */
	private ctx: CanvasRenderingContext2D;

	/** The canvas from the viewport */
	private canvas: HTMLCanvasElement;

	private enabled: boolean = false;

	/** The location of the mouse on the canvas */
	private mouse: Point | null = null;

	/** The stop the user is most likely aiming for with their mouse */
	private intent: Stop | null = null;

	/** Place to store event listeners between enable and disable */
	private boundEventListeners: {
		[key: string]: (this: HTMLCanvasElement, ev: MouseEvent) => any;
	} = {};

	constructor(public viewport: Viewport, public world: World) {
		this.ctx = viewport.ctx;
		this.canvas = viewport.canvas;
	}

	dispose(): void {
		throw new Error("Method not implemented.");
	}
	save(): void {
		throw new Error("Method not implemented.");
	}
	isEnabled(): boolean {
		return this.enabled;
	}

	disable(): void {
		this.removeEventListeners();
		this.enabled = false;
	}

	enable(): void {
		this.addEventListeners();
		this.enabled = true;
	}

	display(): void {
		if (this.intent) {
			this.intent.draw(this.ctx);
		}
	}

	private addEventListeners(): void {
		this.boundEventListeners = {
			mouseDown: this.handleMouseDown.bind(this),
			mouseMove: this.handleMouseMove.bind(this),
			contextMenu: (evt) => evt.preventDefault(),
		};
		this.canvas.addEventListener("mousedown", this.boundEventListeners.mouseDown);
		this.canvas.addEventListener("mousemove", this.boundEventListeners.mouseMove);
		this.canvas.addEventListener("contextmenu", this.boundEventListeners.contextMenu);
	}

	private removeEventListeners(): void {
		this.canvas.removeEventListener("mousedown", this.boundEventListeners.mouseDown);
		this.canvas.removeEventListener("mousemove", this.boundEventListeners.mouseMove);
		this.canvas.removeEventListener("contextmenu", this.boundEventListeners.contextMenu);
	}

	private handleMouseMove(evt: MouseEvent) {
		this.mouse = this.viewport.getMouse(evt, true);
		const seg = getNearestSegment(
			this.mouse,
			this.world.graph.segments,
			10 * this.viewport.zoom
		);
		if (seg) {
			const proj = seg.projectPoint(this.mouse);

			// make sure it is truly on the segment, not the support line
			if (proj.offset >= 0 && proj.offset <= 1) {
				this.intent = new Stop(
					proj.point,
					seg.directionVector(),
					this.world.roadWidth,
					this.world.roadWidth / 2
				);
			} else {
				this.intent = null;
			}
		} else {
			this.intent = null;
		}
	}

	private handleMouseDown(evt: MouseEvent) {}
}
