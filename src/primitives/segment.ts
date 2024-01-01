import Point from "./point";
import AbstractPrimitive from "./abstractPrimitive";
import { PointData } from "./point";
import { add, distance, dot, magnitude, normalize, scale, subtract } from "../math/utils";
import Item from "../interfaces/item";
import Primitive from "../interfaces/primitive";

export interface SegmentData {
	p1: PointData;
	p2: PointData;
}

/**
 * Represents a segment between two points
 */
export default class Segment extends AbstractPrimitive {
	/**
	 * Constructs a Segment instance with two points
	 * @param p1 - The first point of the segment
	 * @param p2 - The second point of the segment
	 */
	constructor(public p1: Point, public p2: Point) {
		super();
	}

	/**
	 *	Loads a segment from segment data and a list of existing points
	 * @param data The segment data to load
	 * @param points list of points to reference to find the points of the segment
	 * @returns
	 */
	static load(data: SegmentData, points: Point[]): Segment {
		return new Segment(
			points.find((p) => p.equals(Point.load(data.p1)))!,
			points.find((p) => p.equals(Point.load(data.p2)))!
		);
	}

	setParent(parent: Item | Primitive): Segment {
		super.setParent(parent);
		return this;
	}

	length(): number {
		return distance(this.p1, this.p2);
	}

	directionVector(): Point {
		return normalize(subtract(this.p2, this.p1));
	}

	/**
	 * Checks if the current segment is equal to another segment
	 * @param segment - The segment to compare for equality
	 * @returns True if the segments are equal, otherwise false
	 */
	equals(segment: Segment): boolean {
		return this.includes(segment.p1) && this.includes(segment.p2);
	}

	/**
	 * Checks if the segment includes a specific point
	 * @param point - The point to check for inclusion in the segment
	 * @returns True if the segment includes the point, otherwise false
	 */
	includes(point: Point): boolean {
		return this.p1.equals(point) || this.p2.equals(point);
	}

	/**
	 * Calculates the distance from the segment to a given point.
	 * If the projection of the point falls within the segment, the distance is calculated from the projected point.
	 * Otherwise, the distance is calculated from the closest endpoint of the segment.
	 * @param point The point to calculate the distance to.
	 * @returns The distance from the segment to the point.
	 */
	distanceToPoint(point: Point): number {
		const proj = this.projectPoint(point);
		if (proj.offset > 0 && proj.offset < 1) {
			return distance(point, proj.point);
		}
		const distToP1 = distance(point, this.p1);
		const distToP2 = distance(point, this.p2);
		return Math.min(distToP1, distToP2);
	}

	/**
	 * Projects a point onto the line segment and returns the projected point and the offset from the starting point of the segment.
	 * @param point The point to be projected onto the line segment.
	 * @returns An object containing the projected point and the offset from the starting point of the segment.
	 */
	projectPoint(point: Point): { point: Point; offset: number } {
		const a = subtract(point, this.p1);
		const b = subtract(this.p2, this.p1);
		const normB = normalize(b);
		const scaler = dot(a, normB);
		const proj = {
			point: add(this.p1, scale(normB, scaler)),
			offset: scaler / magnitude(b),
		};
		return proj;
	}

	/**
	 * Draws the segment on the canvas
	 * @param ctx - The CanvasRenderingContext2D to draw on
	 * @param width - The width of the line (default is 2)
	 * @param color - The color of the line (default is black)
	 */
	draw(
		ctx: CanvasRenderingContext2D,
		{
			width = 2,
			color = "black",
			dash = [],
		}: {
			width?: number;
			color?: string;
			dash?: number[];
		} = {}
	): void {
		ctx.beginPath();
		ctx.lineWidth = width;
		ctx.strokeStyle = color;
		ctx.setLineDash(dash);
		ctx.moveTo(this.p1.x, this.p1.y);
		ctx.lineTo(this.p2.x, this.p2.y);
		ctx.stroke();
		ctx.setLineDash([]);
	}

	hash(): string {
		return { p1: this.p1.hash(), p2: this.p2.hash() }.toString();
	}
}
