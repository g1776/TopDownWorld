interface GraphData {
	points: PointData[];
	segments: SegmentData[];
}

/**
 * Represents a graph containing points and segments
 */
class Graph {
	/**
	 * Constructs a Graph instance with points and segments
	 * @param points - Array of points (default is an empty array)
	 * @param segments - Array of segments (default is an empty array)
	 */
	constructor(public points: Point[] = [], public segments: Segment[] = []) {
		this.points = points;
		this.segments = segments;
	}

	static load(data: GraphData): Graph {
		const points = data.points.map(Point.load);
		const segments = data.segments.map((seg) => Segment.load(seg, points));
		return new Graph(points, segments);
	}

	/**
	 * Gets the hash of the graph
	 * @returns The hash of the graph. Simply a JSON string of the graph
	 */
	hash(): string {
		return JSON.stringify(this);
	}

	/**
	 * Adds a point to the graph
	 * @param point - The point to add
	 */
	addPoint(point: Point | null): void {
		if (!point) return;
		this.points.push(point);
	}

	/**
	 * Tries to add a point to the graph if it doesn't already exist
	 * @param point - The point to add
	 * @returns True if the point was added, otherwise false
	 */
	tryAddPoint(point: Point): boolean {
		if (!this.containsPoint(point)) {
			this.addPoint(point);
			return true;
		}
		return false;
	}

	/**
	 * Checks if the graph contains a specific point
	 * @param point - The point to check for
	 * @returns The matching point if found, otherwise undefined
	 */
	containsPoint(point: Point): Point | undefined {
		return this.points.find((p) => p.equals(point));
	}

	/**
	 * Removes a point from the graph along with its associated segments
	 * @param point - The point to remove
	 */
	removePoint(point: Point): void {
		this.getSegmentsWithPoint(point).forEach((seg) => this.removeSegment(seg));
		this.points.splice(this.points.indexOf(point), 1);
	}

	/**
	 * Adds a segment to the graph
	 * @param seg - The segment to add
	 */
	addSegment(seg: Segment): void {
		this.segments.push(seg);
	}

	/**
	 * Tries to add a segment to the graph if it doesn't already exist and is valid
	 * @param seg - The segment to add
	 * @returns True if the segment was added, otherwise false
	 */
	tryAddSegment(seg: Segment): boolean {
		if (!this.containsSegment(seg) && !seg.p1.equals(seg.p2)) {
			this.addSegment(seg);
			return true;
		}
		return false;
	}

	/**
	 * Checks if the graph contains a specific segment
	 * @param seg - The segment to check for
	 * @returns The matching segment if found, otherwise undefined
	 */
	containsSegment(seg: Segment): Segment | undefined {
		return this.segments.find((s) => s.equals(seg));
	}

	/**
	 * Removes a segment from the graph
	 * @param seg - The segment to remove
	 */
	removeSegment(seg: Segment): void {
		this.segments.splice(this.segments.indexOf(seg), 1);
	}

	/**
	 * Gets all segments associated with a specific point
	 * @param point - The point to search for in segments
	 * @returns An array of segments associated with the point
	 */
	getSegmentsWithPoint(point: Point): Segment[] {
		return this.segments.filter((seg) => seg.includes(point));
	}

	/**
	 * Clears all points and segments from the graph
	 */
	dispose(): void {
		this.points.length = 0;
		this.segments.length = 0;
	}

	/**
	 * Draws all segments and points of the graph on the canvas
	 * @param ctx - The CanvasRenderingContext2D to draw on
	 */
	draw(ctx: CanvasRenderingContext2D): void {
		for (const seg of this.segments) {
			seg.draw(ctx);
		}

		for (const point of this.points) {
			point.draw(ctx);
		}
	}
}
