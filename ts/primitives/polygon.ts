class Polygon implements Primitive {
	segments: Segment[];
	constructor(public points: Point[]) {
		this.segments = [];
		for (let i = 1; i <= points.length; i++) {
			this.segments.push(new Segment(points[i - 1], points[i % points.length]));
		}
	}

	/**
	 * Computes the union of multiple polygons and returns an array of segments.
	 * The union of polygons is the set of all points that are contained in at least one of the polygons.
	 * 
	 * @param polys An array of polygons to compute the union.
	 * @returns An array of segments representing the union of the polygons.
	 */
	static union(polys: Polygon[]): Segment[] {
		Polygon.multiBreak(polys);
		const keptSegments: Segment[] = [];
		for (let i = 0; i < polys.length; i++) {
			polys[i].segments.forEach((seg) => {
				let keep = true;
				for (let j = 0; j < polys.length; j++) {
					if (i != j) {
						if (polys[j].containsSegment(seg)) {
							keep = false;
							break;
						}
					}
				}
				if (keep) {
					keptSegments.push(seg);
				}
			});
		}
		return keptSegments;
	}

	/**
	 * Breaks multiple polygons into smaller polygons by calling the `break` method for each pair of polygons.
	 * @param polys An array of polygons to be broken.
	 */
	static multiBreak(polys: Polygon[]) {
		for (let i = 0; i < polys.length - 1; i++) {
			for (let j = i + 1; j < polys.length; j++) {
				Polygon.break(polys[i], polys[j]);
			}
		}
	}

	/**
	 * Breaks the given polygons at their intersections and updates the segments accordingly.
	 * 
	 * @param poly1 - The first polygon.
	 * @param poly2 - The second polygon.
	 */
	static break(poly1: Polygon, poly2: Polygon) {
		const segs1 = poly1.segments;
		const segs2 = poly2.segments;
		for (let i = 0; i < segs1.length; i++) {
			for (let j = 0; j < segs2.length; j++) {
				const intersection = getIntersection(
					segs1[i].p1,
					segs1[i].p2,
					segs2[j].p1,
					segs2[j].p2
				);

				if (intersection && intersection.offset != 1 && intersection.offset != 0) {
					const point = new Point(intersection.x, intersection.y);
					let aux = segs1[i].p2;
					segs1[i].p2 = point;
					segs1.splice(i + 1, 0, new Segment(point, aux));
					aux = segs2[j].p2;
					segs2[j].p2 = point;
					segs2.splice(j + 1, 0, new Segment(point, aux));
				}
			}
		}
	}

	/**
	 * Checks if the current polygon intersects with another polygon.
	 * @param poly The other polygon to check for intersection.
	 * @returns A boolean indicating whether there is an intersection between the two polygons.
	 */
	intersectsPoly(poly: Polygon): boolean {
		for (const seg of this.segments) {
			for (const otherSeg of poly.segments) {
				// if there is an intersection between any two segments, return true
				if (getIntersection(seg.p1, seg.p2, otherSeg.p1, otherSeg.p2)) {
					return true;
				}
			}
		}
		return false;
	}

	distanceToPoint(point: Point): number {
		return Math.min(...this.segments.map((seg) => seg.distanceToPoint(point)));
	}

	containsSegment(seg: Segment): boolean {
		const midpoint = average(seg.p1, seg.p2);
		return this.containsPoint(midpoint);
	}

	containsPoint(point: Point): boolean {
		const outerPoint = new Point(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
		let intersectionCount = 0;
		for (const seg of this.segments) {
			const intersection = getIntersection(point, outerPoint, seg.p1, seg.p2);
			if (intersection) {
				intersectionCount++;
			}
		}
		return intersectionCount % 2 == 1;
	}

	draw(
		ctx: CanvasRenderingContext2D,
		{ stroke = "blue", lineWidth = 2, fill = "rgba(0,0,255,0.3)" } = {}
	) {
		if (this.points.length == 0) return;
		ctx.beginPath();
		ctx.fillStyle = fill;
		ctx.strokeStyle = stroke;
		ctx.lineWidth = lineWidth;
		ctx.moveTo(this.points[0].x, this.points[0].y);
		this.points.forEach((p) => ctx.lineTo(p.x, p.y));
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}

	hash(): string {
		return JSON.stringify(this.points);
	}
}
