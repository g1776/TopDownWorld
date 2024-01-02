import { Point, Segment } from "../primitives";

/**
 * Finds the nearest point to a given location within a specified threshold from an array of points
 * @param loc - The reference point for which the nearest point is to be found
 * @param points - Array of points to search from
 * @param threshold - The maximum distance within which to consider a point as nearest (default is maximum safe integer)
 * @returns The nearest point and its distance from the reference point if it exists, otherwise null
 */
export function getNearestPoint(
	loc: Point,
	points: Point[],
	threshold = Number.MAX_SAFE_INTEGER
): {
	point: Point;
	distance: number;
} | null {
	let minDist = Number.MAX_SAFE_INTEGER;
	let closestPoint: Point | null = null;

	points.forEach((point) => {
		// Ignore itself
		if (point.equals(loc)) {
			return;
		}
		const dist = distance(point, loc);
		if (dist < minDist && dist < threshold) {
			minDist = dist;
			closestPoint = point;
		}
	});

	return {
		point: closestPoint,
		distance: minDist,
	};
}

export function getNearestSegment(
	loc: Point,
	segments: Segment[],
	threshold = Number.MAX_SAFE_INTEGER
): Segment | null {
	let minDist = Number.MAX_SAFE_INTEGER;
	let nearest: Segment | null = null;

	segments.forEach((segment) => {
		const dist = segment.distanceToPoint(loc);
		if (dist < minDist && dist < threshold) {
			minDist = dist;
			nearest = segment;
		}
	});

	return nearest;
}

/**
 * Calculates the Euclidean distance between two points
 * @returns The distance between the two points
 */
export function distance(p1: Point, p2: Point): number {
	return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export function add(p1: Point, p2: Point): Point {
	return new Point(p1.x + p2.x, p1.y + p2.y);
}

export function subtract(p1: Point, p2: Point): Point {
	return new Point(p1.x - p2.x, p1.y - p2.y);
}

export function average(p1: Point, p2: Point): Point {
	return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}

export function scale(p: Point, scaler: number): Point {
	return new Point(p.x * scaler, p.y * scaler);
}

export function normalize(p: Point): Point {
	return scale(p, 1 / magnitude(p));
}

export function magnitude(p: Point): number {
	return Math.hypot(p.x, p.y);
}

/**
 * Translates a point by a given angle and offset.
 * @param loc - The original point to be translated.
 * @param angle - The angle in radians by which to translate the point.
 * @param offset - The distance by which to translate the point.
 * @returns The translated point.
 */
export function translate(loc: Point, angle: number, offset: number): Point {
	return new Point(loc.x + Math.cos(angle) * offset, loc.y + Math.sin(angle) * offset);
}

/**
 *
 * @param p
 * @returns The angle in radians of the point relative to the origin.
 */
export function angle(p: Point): number {
	return Math.atan2(p.y, p.x);
}

/**
 * Calculates the intersection point between two line segments.
 *
 * @param A - The starting point of the first line segment.
 * @param B - The ending point of the first line segment.
 * @param C - The starting point of the second line segment.
 * @param D - The ending point of the second line segment.
 * @returns The intersection point if it exists, otherwise null.
 */
export function getIntersection(A: Point, B: Point, C: Point, D: Point) {
	const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
	const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
	const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

	const eps = 0.001; // workaround for floating point precision issues
	if (Math.abs(bottom) > eps) {
		const t = tTop / bottom;
		const u = uTop / bottom;
		if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
			return {
				x: lerp(A.x, B.x, t),
				y: lerp(A.y, B.y, t),
				offset: t,
			};
		}
	}

	return null;
}

/**
 *
 * @returns The dot product of the two points
 */
export function dot(p1: Point, p2: Point): number {
	return p1.x * p2.x + p1.y * p2.y;
}

export function lerp(a: number, b: number, t: number) {
	return a + (b - a) * t;
}

export function lerp2D(p1: Point, p2: Point, t: number) {
	return new Point(lerp(p1.x, p2.x, t), lerp(p1.y, p2.y, t));
}

export function getRandomColor() {
	const hue = 290 + Math.random() * 260;
	return "hsl(" + hue + ", 100%, 60%)";
}

/**
 * Returns a point that is artificially raise z units above the given point. (For faking 3D)
 */
export function getPointOnZPlane(p: Point, viewPoint: Point, z: number) {
	return add(p, scale(subtract(p, viewPoint), z));
}
