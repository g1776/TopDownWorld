import { EditorMode } from "../enums";
import Crossing from "../markings/crossing";
import { Point } from "../primitives";
import Editor from "interfaces/editor";
import Viewport from "viewport";
import World from "world";
import Marking from "interfaces/marking";
import MarkingEditor from "./markingEditor";

export default class CrossingEditor extends MarkingEditor {
	public readonly type: EditorMode = EditorMode.CROSSING;

	constructor(public viewport: Viewport, public world: World) {
		super(viewport, world, world.graph.segments);
	}

	override createMarking(center: Point, directionVector: Point): Marking {
		const width = this.world.roadWidth;
		const height = this.world.roadWidth / 2;
		return new Crossing(center, directionVector, width, height);
	}
}
