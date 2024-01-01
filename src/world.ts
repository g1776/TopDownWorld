import { Segment, Point, Polygon, Envelope } from "./primitives";
import Graph from "math/graph";
import { add, distance, lerp, scale } from "./math/utils";
import { Road, Building, Tree } from "./items";
import Primitive from "./interfaces/primitive";
import Settings from "./settings";

type CachedRender = {
	roadBorders: Segment[];
	buildings: Building[];
	segments: Segment[];
};

export type WorldData = {
	treesEnabled: boolean;
	title: string;
};

export default class World {
	roads: Road[];
	roadBorders: Segment[];
	buildings: Building[] = [];
	trees: Set<Tree> = new Set();
	laneGuides: Segment[] = [];

	private treesEnabled = false;

	/**
	 * If true, the world will be regenerated on the next render.
	 */
	private regenerateAllTrees = false;

	private lastRender: CachedRender = {
		roadBorders: [],
		buildings: [],
		segments: [],
	};

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
		const world = new World(graph);
		if (worldData.treesEnabled) {
			world.enableTrees();
		} else {
			world.disableTrees();
		}
		world.title = worldData.title;
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
		this.regenerateAllTrees = true;
		this.generate();
	}

	disableTrees() {
		this.treesEnabled = false;
		this.regenerateAllTrees = true;
		this.generate();
	}

	generate() {
		this.roads.length = 0;

		for (const seg of this.graph.segments) {
			this.roads.push(new Road(seg, this.roadWidth, this.roadRoundness));
		}

		this.roadBorders = Polygon.union(this.roads.map((road) => road.base));
		this.buildings = this.generateBuildings();
		this.trees = this.treesEnabled ? this.generateTrees() : new Set();
		this.laneGuides = this.generateLaneGuides();

		this.lastRender = {
			roadBorders: this.roadBorders,
			buildings: this.buildings,
			segments: this.graph.segments,
		};
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

	generateTrees(): Set<Tree> {
		if (this.graph.segments.length === 0) {
			return new Set();
		}

		let newRoadBorders: Segment[];
		let newBuildingBases: Polygon[];

		if (this.regenerateAllTrees) {
			this.regenerateAllTrees = false;
			newRoadBorders = this.roadBorders;
			newBuildingBases = this.buildings.map((b) => b.base);
		} else {
			// determine the new roadBorders and buildings since the last render
			newRoadBorders = this.getNewPrimitivesSinceLastRender(
				this.roadBorders,
				this.lastRender.roadBorders
			) as Segment[];
			newBuildingBases = this.getNewPrimitivesSinceLastRender(
				this.buildings.map((b) => b.base),
				this.lastRender.buildings.map((b) => b.base)
			) as Polygon[];
		}

		// if there are no new road borders or building bases, we can use the same trees from the last render
		if (newRoadBorders.length === 0 && newBuildingBases.length === 0) {
			return this.trees;
		}

		// Determine the bounds that trees can be generated in
		const points = [
			...newRoadBorders.map((seg) => [seg.p1, seg.p2]).flat(),
			...newBuildingBases.map((b) => b.points).flat(),
		];

		// Determine the bounds that trees can be generated in
		let left = Infinity;
		let right = -Infinity;
		let top = Infinity;
		let bottom = -Infinity;

		for (const p of points) {
			if (p.x < left) left = p.x;
			if (p.x > right) right = p.x;
			if (p.y < top) top = p.y;
			if (p.y > bottom) bottom = p.y;
		}

		// We dont want to generate trees on the road or in buildings
		const illegalPolys = new Set([
			...this.buildings.map((b) => b.base),
			...this.roads.map((road) => road.base),
		]);

		const newTrees: Set<Tree> = new Set();
		const closestGraphSegments = new Map<Tree, Segment>();

		// validate old tree locations
		for (const oldTree of this.trees) {
			if (this.validateTreeLocation(oldTree.center, illegalPolys, newTrees)) {
				newTrees.add(oldTree);
			}
		}

		let tryCount = 0;
		const treeCountScaleFactor = 100 * Settings.TREE_COUNT_SCALE_FACTOR;

		while (tryCount < treeCountScaleFactor) {
			// generate a random point in the bounds
			const randX = Math.random();
			const randY = Math.random();
			const p = new Point(lerp(left, right, randX), lerp(bottom, top, randY));

			// validate the point
			const keep = this.validateTreeLocation(p, illegalPolys, newTrees);

			// find the closest graph segment to the tree and set it as the parent
			const closestGraphSegment = this.graph.segments.reduce((prev, curr) =>
				curr.distanceToPoint(p) < prev.distanceToPoint(p) ? curr : prev
			);
			p.setParent(closestGraphSegment);

			if (keep) {
				const newTree = new Tree(p, this.treeRadius, this.treeHeight);
				newTrees.add(newTree);
				closestGraphSegments.set(newTree, closestGraphSegment);
				tryCount = 0;
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

	private getNewPrimitivesSinceLastRender(
		currPrimitives: Primitive[],
		lastRenderPrimitives: Primitive[]
	): Primitive[] {
		let newPrimitives: Primitive[] = [];

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

	private validateTreeLocation(
		p: Point,
		illegalPolys: Set<Polygon>,
		otherTrees: Set<Tree>
	): boolean {
		const numTreesToPadWith = 2;
		let closeToSomething = false;

		// make sure the tree is not in an illegal polygon and is close to something
		for (const poly of illegalPolys) {
			if (poly.containsPoint(p) || poly.distanceToPoint(p) < this.treeRadius / 2) {
				return false;
			}

			if (
				!closeToSomething &&
				poly.distanceToPoint(p) < this.treeRadius * numTreesToPadWith
			) {
				closeToSomething = true;
			}
		}

		if (!closeToSomething) {
			return false;
		}

		// make sure the tree is not too close to another tree
		for (const tree of otherTrees) {
			if (distance(tree.center, p) < this.treeRadius) {
				return false;
			}
		}

		return true;
	}

	draw(ctx: CanvasRenderingContext2D, viewPoint: Point) {
		this.roads.forEach((road) => road.draw(ctx));

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
}
