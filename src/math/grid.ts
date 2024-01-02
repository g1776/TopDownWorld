import { Polygon, Point } from "../primitives";
import { scale, add } from "./utils";

export default class Grid {
	cells: Polygon[][];

	constructor(public rows: number, public cols: number, public cellSize: number) {
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

		// apply the offset than centers the grid
		return rawPoints.map((point) =>
			add(point, scale(new Point(this.cols / 2, this.rows / 2), -this.cellSize))
		);
	}

	draw(ctx: CanvasRenderingContext2D): void {
		const centeringOffset = scale(new Point(this.cols / 2, this.rows / 2), -this.cellSize);

		this.cells.forEach((row) =>
			row.forEach((cell) => {
				const offsetCell = new Polygon(
					cell.points.map((point) => add(point, centeringOffset))
				);
				offsetCell.draw(ctx, {
					stroke: "rgba(0,0,0,0.4)",
					lineWidth: 3.5,
					dash: [19],
					fill: "rgba(0,0,0,0)",
				});
			})
		);
	}

	/**
	 * @description Creates a square cell at the given row and column, optimizing it to share points with adjacent cells (currently only in the same row)
	 * @param row
	 * @param col
	 * @returns
	 */
	private createSquareCell(row: number, col: number): Polygon {
		let topLeft =
			col > 0
				? this.cells[row][col - 1].points[1]
				: new Point(col * this.cellSize, row * this.cellSize);
		let topRight = new Point((col + 1) * this.cellSize, row * this.cellSize);
		let bottomRight = new Point((col + 1) * this.cellSize, (row + 1) * this.cellSize);
		let bottomLeft =
			row > 0
				? this.cells[row - 1][col].points[2]
				: new Point(col * this.cellSize, (row + 1) * this.cellSize);

		return new Polygon([topLeft, topRight, bottomRight, bottomLeft]);
	}
}
