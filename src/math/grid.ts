import Settings from "../settings";
import { Polygon, Point, Segment } from "../primitives";
import { scale, add } from "./utils";

export default class Grid {
	private cells: (Polygon & { excluded?: boolean })[][];

	constructor(
		public rows: number,
		public cols: number,
		public cellSize: number,

		/**
		 * @description Optional offset of the entire grid, in pixels
		 */
		public offset: Point = new Point(0, 0)
	) {
		this.cells = Array(rows)
			.fill(null)
			.map((_, i) => Array(cols).fill(null));

		this.cells.forEach((row, i) =>
			row.forEach((_, j) => {
				this.cells[i][j] = this.createSquareCell(i, j);
			})
		);
	}

	/**
	 * @description Creates a grid that covers the given polygons, with the given cell size
	 * @param polys The polygons to cover
	 * @param cellSize The size of each cell
	 * @param mode Whether to include/exclude cells that intersect with the given polygons, or keep all cells. Defaults to "all"
	 * @returns A grid that covers the given polygons, with the given cell size
	 */
	static fromRangeOfPolys(
		polys: Polygon[],
		cellSize: number,
		mode: "all" | "include" | "exclude" = "all"
	): Grid {
		if (polys.length === 0) return new Grid(0, 0, cellSize);
		let minX: number, maxX: number, minY: number, maxY: number;
		polys.forEach((poly) => {
			poly.points.forEach((point) => {
				if (minX === undefined || point.x < minX) minX = point.x;
				if (maxX === undefined || point.x > maxX) maxX = point.x;
				if (minY === undefined || point.y < minY) minY = point.y;
				if (maxY === undefined || point.y > maxY) maxY = point.y;
			});
		});
		const length = maxX - minX;
		const height = maxY - minY;
		const centeringOffset = new Point(minX + length / 2, minY + height / 2);
		const instance = new Grid(
			Math.ceil((maxY - minY) / cellSize),
			Math.ceil((maxX - minX) / cellSize),
			cellSize,
			centeringOffset
		);

		if (mode === "all") return instance;
		instance.subsetOn(polys, mode);
		return instance;
	}

	getWidth(): number {
		return this.cols * this.cellSize;
	}

	getHeight(): number {
		return this.rows * this.cellSize;
	}

	/**
	 * @description Subset on the given objects, either including or excluding them. Cells already marked as excluded will stay excluded.
	 * @param objs
	 * @param mode Whether to include or exclude cells that intersect with the given objects. Defaults to "include"
	 */
	public subsetOn(
		objects: (Polygon | Segment | Point)[],
		mode: "include" | "exclude" = "include"
	): void {
		const centeringOffset = this.getCenteringOffset();
		this.cells.forEach((row, i) =>
			row.forEach((cell, j) => {
				// skip calculating for cells that are already excluded (in other words, keep them excluded)
				if (cell.excluded) return;

				const offsetCell = new Polygon(
					cell.points.map((point) => add(point, centeringOffset))
				);

				const intersects = objects.some((obj) => {
					if (obj instanceof Polygon) {
						return offsetCell.intersectsPoly(obj) || offsetCell.containedByPoly(obj);
					} else if (obj instanceof Segment) {
						return offsetCell.containsSegment(obj);
					} else if (obj instanceof Point) {
						return offsetCell.containsPoint(obj);
					}
				});

				this.cells[i][j].excluded = mode === "exclude" ? intersects : !intersects;
			})
		);
	}

	/**
	 *
	 * @returns A list of all points in the grid, duplicates removed
	 */
	getPoints(): Point[] {
		const rawPoints = this.cells
			.flat()
			.flatMap((cell) => cell.points)
			.reduce((acc, point) => {
				if (!acc.some((p) => p.equals(point))) {
					acc.push(point);
				}
				return acc;
			}, [] as Point[]);

		// apply the offset that centers the grid
		const centeringOffset = this.getCenteringOffset();
		return rawPoints.map((point) => add(point, centeringOffset));
	}

	getCells(noExcluded = false): Polygon[] {
		let rawCells = this.cells.flat();
		if (noExcluded) {
			rawCells = rawCells.filter((cell) => !cell.excluded);
		}

		// apply the offset that centers the grid
		const centeringOffset = this.getCenteringOffset();
		return rawCells.map(
			(cell) => new Polygon(cell.points.map((point) => add(point, centeringOffset)))
		);
	}

	/**
	 *
	 * @param ctx
	 * @param highlightExcluded Optional parameter to highlight the cells that are marked as included
	 */
	draw(ctx: CanvasRenderingContext2D, highlightExcluded = false): void {
		const centeringOffset = this.getCenteringOffset();

		this.cells.forEach((row, i) =>
			row.forEach((cell, j) => {
				const offsetCell = new Polygon(
					cell.points.map((point) => add(point, centeringOffset))
				);
				if (highlightExcluded && cell.excluded) {
					offsetCell.draw(ctx, {
						stroke: "rgba(0,0,0,0.4)",
						lineWidth: 3.5,
						dash: [19],
						fill: "rgba(125,0,0,0.5)",
					});
				} else {
					offsetCell.draw(ctx, {
						stroke: "rgba(0,0,0,0.4)",
						lineWidth: 3.5,
						dash: [19],
						fill: "rgba(0,0,0,0.0)",
					});
				}

				// if (Settings.DEBUG) {
				// 	// draw the row and column numbers
				// 	ctx.fillStyle = "white";
				// 	ctx.font = "30px Arial";
				// 	ctx.fillText(
				// 		`${i}, ${j}`,
				// 		offsetCell.points[0].x + this.cellSize / 2,
				// 		offsetCell.points[0].y + this.cellSize / 2
				// 	);
				// }
			})
		);
	}

	private getCenteringOffset(): Point {
		return add(scale(new Point(this.cols / 2, this.rows / 2), -this.cellSize), this.offset);
	}

	private createSquareCell(row: number, col: number): Polygon {
		const topLeft = new Point(col * this.cellSize, row * this.cellSize);
		const topRight = new Point((col + 1) * this.cellSize, row * this.cellSize);
		const bottomRight = new Point((col + 1) * this.cellSize, (row + 1) * this.cellSize);
		const bottomLeft = new Point(col * this.cellSize, (row + 1) * this.cellSize);
		return new Polygon([topLeft, topRight, bottomRight, bottomLeft]);
	}
}
