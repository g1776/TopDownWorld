import Editor from "../interfaces/editor";
import { Point, Segment } from "../primitives";
import Graph from "../math/graph";
import Viewport from "../viewport";
import { getNearestPoint } from "../math/utils";
import { EditorMode } from "../enums";

/** Represents an editor for interacting with a graph on a canvas */
export default class GraphEditor implements Editor {
	public readonly type = EditorMode.GRAPH;

	/** The currently selected point in the editor */
	private selected: Point | null = null;

	/** The currently hovered point in the editor */
	private hovered: Point | null = null;

	/** Indicates whether a dragging action is currently ongoing */
	private dragging: boolean = false;

	/** The location of the mouse on the canvas */
	private mouse: Point | null = null;

	/** The CanvasRenderingContext2D used for drawing on the canvas */
	private ctx: CanvasRenderingContext2D;

	/** The canvas from the viewport */
	private canvas: HTMLCanvasElement;

	private enabled: boolean = false;

	/** Place to store event listeners between enable and disable */
	private boundEventListeners: {
		[key: string]: (this: HTMLCanvasElement, ev: MouseEvent) => any;
	} = {};

	/**
	 * Constructs a GraphEditor instance
	 * @param canvas - The HTMLCanvasElement associated with the editor
	 * @param graph - The graph instance to edit
	 */
	constructor(public viewport: Viewport, public graph: Graph) {
		this.ctx = this.viewport.ctx;
		this.canvas = this.viewport.canvas;
	}

	save() {
		localStorage.setItem("graph", JSON.stringify(this.graph));
	}

	dispose(promptFirst: boolean = true) {
		if (promptFirst) {
			const response = confirm(
				"Are you sure you want to clear? Any unsaved progress will be lost."
			);
			if (!response) return;
		}
		this.graph.dispose();
		this.selected = null;
		this.hovered = null;
	}

	isEnabled(): boolean {
		return this.enabled;
	}

	disable(): void {
		this.removeEventListeners();
		this.enabled = false;
		this.selected = null;
		this.hovered = null;
	}

	enable(): void {
		this.addEventListeners();
		this.enabled = true;
	}

	/**
	 * Displays the graph and points on the canvas
	 */
	display(): void {
		this.graph.draw(this.ctx);
		if (this.hovered) {
			this.hovered.draw(this.ctx, { fill: true });
		}
		if (this.selected) {
			let intent = this.hovered ? this.hovered : this.mouse;
			if (!intent) return;
			new Segment(this.selected, intent).draw(this.ctx, { dash: [3, 3] });

			this.selected.draw(this.ctx, { outline: true });
		}
	}

	/**
	 * Adds event listeners for mouse interactions on the canvas
	 * - Left-click to select/hover/add points
	 * - Right-click to remove a hovered point
	 * - Dragging to move a selected point
	 */
	private addEventListeners(): void {
		this.boundEventListeners = {
			mouseDown: this.handleMouseDown.bind(this),
			mouseMove: this.handleMouseMove.bind(this),
			contextMenu: (evt) => evt.preventDefault(),
			mouseUp: () => (this.dragging = false),
		};
		this.canvas.addEventListener("mousedown", this.boundEventListeners.mouseDown);
		this.canvas.addEventListener("mousemove", this.boundEventListeners.mouseMove);
		this.canvas.addEventListener("contextmenu", this.boundEventListeners.contextMenu);
		this.canvas.addEventListener("mouseup", this.boundEventListeners.mouseUp);
	}

	private removeEventListeners(): void {
		this.canvas.removeEventListener("mousedown", this.boundEventListeners.mouseDown);
		this.canvas.removeEventListener("mousemove", this.boundEventListeners.mouseMove);
		this.canvas.removeEventListener("contextmenu", this.boundEventListeners.contextMenu);
		this.canvas.removeEventListener("mouseup", this.boundEventListeners.mouseUp);
	}

	private handleMouseDown(evt: MouseEvent) {
		const LEFT_CLICK = 0;
		const RIGHT_CLICK = 2;

		if (evt.button === LEFT_CLICK) {
			if (this.hovered) {
				this.selectPoint(this.hovered);
				this.dragging = true;
				return;
			}
			this.graph.addPoint(this.mouse);
			this.selectPoint(this.mouse);
			this.hovered = this.mouse;
		}

		if (evt.button === RIGHT_CLICK) {
			if (this.selected) {
				this.selected = null;
			} else {
				if (this.hovered) {
					this.removePoint(this.hovered);
				}
			}
		}
	}

	private handleMouseMove(evt: MouseEvent) {
		this.mouse = this.viewport.getMouse(evt, true);
		this.hovered = getNearestPoint(this.mouse, this.graph.points, 10 * this.viewport.zoom);
		if (this.dragging) {
			if (this.selected) {
				this.selected.x = this.mouse.x;
				this.selected.y = this.mouse.y;
			}
		}
	}

	private selectPoint(point: Point | null): void {
		if (!point) return;
		if (this.selected) {
			this.graph.tryAddSegment(new Segment(this.selected, point));
		}
		this.selected = point;
	}

	/**
	 * Removes a point from the graph and resets hovered and selected points if necessary
	 * @param point - The point to remove
	 */
	private removePoint(point: Point): void {
		this.graph.removePoint(point);
		this.hovered = null;
		if (this.selected === point) {
			this.selected = null;
		}
	}
}
