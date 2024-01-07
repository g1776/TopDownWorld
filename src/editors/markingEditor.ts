import { EditorMode } from "../enums";
import Stop from "../markings/stop";
import { Point, Segment } from "../primitives";
import { getNearestSegment } from "../math/utils";
import Editor from "interfaces/editor";
import Viewport from "viewport";
import World from "world";
import Marking from "interfaces/marking";

export default abstract class MarkingEditor implements Editor {
	public readonly type: EditorMode = EditorMode.STOP;

	private markings: Marking[];

	/** The CanvasRenderingContext2D used for drawing on the canvas */
	private ctx: CanvasRenderingContext2D;

	/** The canvas from the viewport */
	private canvas: HTMLCanvasElement;

	private enabled: boolean = false;

	/** The location of the mouse on the canvas */
	private mouse: Point | null = null;

	/** The stop the user is most likely aiming for with their mouse */
	private intent: Marking | null = null;

	/** Place to store event listeners between enable and disable */
	private boundEventListeners: {
		[key: string]: (this: HTMLCanvasElement, ev: MouseEvent) => any;
	} = {};

	constructor(
		public viewport: Viewport,
		public world: World,
		private targetSegments: Segment[]
	) {
		this.ctx = viewport.ctx;
		this.canvas = viewport.canvas;

		this.markings = world.markings;
	}

	// to be implemented by subclasses
	abstract createMarking(center: Point, directionVector: Point): Marking;

	dispose(): void {
		this.markings.length = 0;
	}
	save(): void {
		return;
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
		const seg = getNearestSegment(this.mouse, this.targetSegments, 10 * this.viewport.zoom);
		if (seg) {
			const proj = seg.projectPoint(this.mouse);

			// make sure it is truly on the segment, not the support line
			if (proj.offset >= 0 && proj.offset <= 1) {
				this.intent = this.createMarking(proj.point, seg.directionVector());
			} else {
				this.intent = null;
			}
		} else {
			this.intent = null;
		}
	}

	private handleMouseDown(evt: MouseEvent) {
		const LEFT_CLICK = 0;
		const RIGHT_CLICK = 2;
		if (evt.button == LEFT_CLICK) {
			if (this.intent) {
				this.markings.push(this.intent);
				this.intent = null;
			}
		}

		if (evt.button == RIGHT_CLICK) {
			this.markings.forEach((marking, i) => {
				const poly = marking.base;
				if (poly.containsPoint(this.mouse)) {
					this.markings.splice(i, 1);
					return;
				}
			});
		}
	}
}
