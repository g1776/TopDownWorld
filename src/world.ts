import { Segment, Point, Polygon, Envelope } from "./primitives";
import Graph from "math/graph";
import { add, distance, lerp, scale } from "./math/utils";
import { Road, Building, Tree } from "./items";
import Primitive from "./interfaces/primitive";
import Settings from "./settings";
import Grid from "./math/grid";
import Quadtree from "@timohausmann/quadtree-js";
import Marking from "interfaces/marking";

export type WorldData = {
	treesEnabled: boolean;
	title: string;
};

export default class World {
	roads: Road[];
	roadBorders: Segment[];
	buildings: Building[] = [];
	trees: Tree[] = [];
	laneGuides: Segment[] = [];
	markings: Marking[] = [];
	private treesEnabled = false;

	constructor(
		public graph: Graph,
		public title = "My World",
		public roadWidth = Settings.ROAD_WIDTH,
		public roadRoundness = Settings.ROAD_ROUNDNESS,

		/***
		 *The width of the building envelope. This is depth of the building, perpendicular to the road.
		 */
		public buildingWidth = Settings.BUILDING_WIDTH,

		/**
		 * The minimum length of the building, parallel to the road.
		 */
		public buildingMinLength = Settings.BUILDING_MIN_LENGTH,
		public buildingSpacing = Settings.BUILDING_SPACING,
		/**
		 * The radius of the trees
		 */
		public treeRadius = Settings.TREE_RADIUS,
		public treeHeight = Settings.TREE_HEIGHT
	) {
		this.roads = [];
		this.roadBorders = [];

		this.generate();
	}

	static load(worldData: WorldData, graph: Graph): World {
		const world = new World(graph, worldData.title);
		if (worldData.treesEnabled) {
			world.enableTrees();
		} else {
			world.disableTrees();
		}
		return world;
	}

	/**
	 * Get the hash of the world data
	 */
	getWorldDataHash(): string {
		return {
			treesEnabled: this.treesEnabled,
			title: this.title,
		}.toString();
	}

	enableTrees() {
		this.treesEnabled = true;
		this.generate();
	}

	disableTrees() {
		this.treesEnabled = false;
		this.generate();
	}

	generate() {
		this.roads.length = 0;

		for (const seg of this.graph.segments) {
			this.roads.push(new Road(seg, this.roadWidth, this.roadRoundness));
		}

		this.roadBorders = Polygon.union(this.roads.map((road) => road.base));
		this.buildings = this.generateBuildings();
		this.trees = this.treesEnabled ? this.generateTrees() : [];
		this.laneGuides = this.generateLaneGuides();
	}

	draw(ctx: CanvasRenderingContext2D, viewPoint: Point) {
		this.roads.forEach((road) => road.draw(ctx));

		// draw markings
		this.markings.forEach((marking) => marking.draw(ctx));

		// draw dashed lines on the road
		this.graph.segments.forEach((seg) =>
			seg.draw(ctx, { color: "white", width: 3, dash: [10, 10] })
		);
		this.roadBorders.forEach((seg) => seg.draw(ctx));

		// sort and draw all the items in 3D
		[...this.buildings, ...this.trees]
			.sort((a, b) => b.base.distanceToPoint(viewPoint) - a.base.distanceToPoint(viewPoint))
			.forEach((item) => {
				item.draw(ctx, viewPoint);
			});
	}

	private generateBuildings(): Building[] {
		if (this.graph.segments.length === 0) {
			return [];
		}

		const tmpEvelopes = this.graph.segments
			// for each segment, generate an envelope around it to create guides for placing buildings
			.map(
				(seg) =>
					new Envelope(
						seg,
						this.roadWidth + this.buildingWidth + this.buildingSpacing * 2,
						// pass a fairly large roundness, so we don't get weird buildings on the edge of the envelope
						// This will ensure that we don't get edges > buildingMinLength
						20
					)
			);

		// Create a union of all envelopes, and keep segments that are long enough. Call these segments "guides".
		const guides = Polygon.union(tmpEvelopes.map((env) => env.poly)).filter(
			(seg) => seg.length() >= this.buildingMinLength
		);

		// For each guide, determine the "support" structures (segments) that will be used to place buildings.
		// These will be spaced along the guide
		let supports: Segment[] = [];
		guides.forEach((seg) => {
			const len = seg.length() + this.buildingSpacing;
			// How many buildings can we fit on this segment?
			const buildingCount = Math.floor(
				len / (this.buildingMinLength + this.buildingSpacing)
			);

			// Based on the number of buildings, what is the length of each building?
			const buildingLength = len / buildingCount - this.buildingSpacing;

			const randomizeLength = (length: number, q1: Point) => {
				let kindOfRandom = Math.pow(Math.cos((q1.x * q1.y) % 11), 2);
				let buildingLengthAdj = buildingLength * (1 - (kindOfRandom * 0.5 - 0.25));
				return buildingLengthAdj;
			};

			const dir = seg.directionVector();

			// build the support segments buildingCount times. These are the "spines" of the buildings, parallel to the road.
			let q1 = seg.p1;
			let buildingLengthAdj = randomizeLength(buildingLength, q1);
			let q2 = add(q1, scale(dir, buildingLengthAdj));
			supports.push(new Segment(q1, q2));

			for (let i = 2; i <= buildingCount; i++) {
				q1 = add(q2, scale(dir, this.buildingSpacing));
				buildingLengthAdj = randomizeLength(buildingLength, q1);
				q2 = add(q1, scale(dir, buildingLengthAdj));
				supports.push(new Segment(q1, q2));
			}
		});

		// add the bases of the buildings. These are the envelopes around the support segments.

		const bases: Polygon[] = supports.map((supportSegment) => {
			// randomize the width of the building a bit
			const kindOfRandom = Math.pow(
				Math.cos((supportSegment.p1.x * supportSegment.p2.y) % 11),
				2
			);
			const width = this.buildingWidth * (1 + kindOfRandom);
			return new Envelope(supportSegment, width).poly;
		});

		// remove bases that intersect, so buildings don't overlap
		bases.forEach((base, i) => {
			bases.forEach((otherBase, j) => {
				if (i !== j && base.intersectsPoly(otherBase)) {
					bases.splice(j, 1);
				}
			});
		});

		return bases.map((b) => new Building(b));
	}

	private generateTrees(): Tree[] {
		if (this.graph.segments.length === 0) {
			return [];
		}

		// We dont want to generate trees on the road or in buildings
		const illegalPolys = [
			...this.buildings.map((b) => b.base),
			...this.roads.map((road) => road.base),
		];

		// calcualte the bounds to generate trees in
		let minX: number, maxX: number, minY: number, maxY: number;
		illegalPolys.forEach((poly) => {
			poly.points.forEach((point) => {
				if (minX === undefined || point.x < minX) minX = point.x;
				if (maxX === undefined || point.x > maxX) maxX = point.x;
				if (minY === undefined || point.y < minY) minY = point.y;
				if (maxY === undefined || point.y > maxY) maxY = point.y;
			});
		});

		const newTrees = [];
		const quadTree = new Quadtree({
			x: 0,
			y: 0,
			width: maxX - minX,
			height: maxY - minY,
		});

		let tryCount = 0;
		const treeCountScaleFactor = 100 * Settings.TREE_COUNT_SCALE_FACTOR;

		while (tryCount < treeCountScaleFactor) {
			// generate a random point in the bounds
			const p = new Point(lerp(minX, maxX, Math.random()), lerp(minY, maxY, Math.random()));

			const validTreeLocation = this.validateTreeLocation(p, quadTree, illegalPolys);

			if (validTreeLocation) {
				const newTree = new Tree(p, this.treeRadius, this.treeHeight);
				newTrees.push(newTree);
				quadTree.insert({
					x: p.x,
					y: p.y,
					width: this.treeRadius * 2,
					height: this.treeRadius * 2,
				});
				tryCount = 0;
				continue;
			}
			tryCount++;
		}

		return newTrees;
	}

	/**
	 *
	 * @returns A list of segments that are in the middle of the lanes of the roads.
	 */
	private generateLaneGuides(): Segment[] {
		const tmpEvelopes = this.graph.segments
			// for each segment, generate an envelope around it to create guides for placing buildings
			.map((seg) => {
				const env = new Envelope(
					seg,
					this.roadWidth / 2,
					// pass a fairly large roundness, so we don't get weird buildings on the edge of the envelope
					// This will ensure that we don't get edges > buildingMinLength
					20
				);

				// set the parent of the envelope to the segment so we can check if the segment still exists on future renders (for optimization)
				env;
				return env;
			});

		const laneGuides = Polygon.union(
			tmpEvelopes.map((env) => {
				const poly = env.poly;
				// pass the parent
				poly;
				return poly;
			})
		);

		return laneGuides;
	}

	private validateTreeLocation(
		loc: Point,
		quadTree: Quadtree,
		illegalPolys: Polygon[]
	): boolean {
		// make sure the tree is not too close to another tree
		// We use a quadtree to not have to check every tree
		let tooCloseToAnotherTree = false;
		const nearbyTrees = quadTree.retrieve({
			x: loc.x,
			y: loc.y,
			width: this.treeRadius * 2,
			height: this.treeRadius * 2,
		});
		for (const treeRect of nearbyTrees) {
			if (distance(new Point(treeRect.x, treeRect.y), loc) < this.treeRadius) {
				tooCloseToAnotherTree = true;
				break;
			}
		}
		if (tooCloseToAnotherTree) {
			return false;
		}

		// make sure the tree is not inside an illegal poly
		let insideIllegalPoly = false;
		const treeBase = new Tree(loc, this.treeRadius, this.treeHeight).base;
		for (const poly of illegalPolys) {
			if (poly.intersectsPoly(treeBase) || treeBase.containedByPoly(poly)) {
				insideIllegalPoly = true;
				break;
			}
		}
		if (insideIllegalPoly) {
			return false;
		}

		// make sure the tree is close to some object
		let closeToSomething = false;
		for (const poly of illegalPolys) {
			if (poly.distanceToPoint(loc) < this.treeRadius * 2) {
				closeToSomething = true;
				break;
			}
		}
		if (!closeToSomething) {
			return false;
		}

		return true;
	}

	private getNewPrimitivesSinceLastRender<PrimitiveType extends Primitive>(
		currPrimitives: PrimitiveType[],
		lastRenderPrimitives: PrimitiveType[]
	): PrimitiveType[] {
		let newPrimitives: PrimitiveType[] = [];

		// Create a set with the hashes of the lastRenderPrimitives
		let lastRenderHashes = new Set(lastRenderPrimitives.map((p) => p.hash()));

		for (const currPrimitive of currPrimitives) {
			// If the hash of the current primitive is not in the set, it's a new primitive
			if (!lastRenderHashes.has(currPrimitive.hash())) {
				newPrimitives.push(currPrimitive);
			}
		}

		return newPrimitives;
	}
}
