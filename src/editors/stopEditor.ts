import { EditorMode } from "../enums";
import Stop from "../markings/stop";
import { Point } from "../primitives";
import { getNearestSegment } from "../math/utils";
import Editor from "interfaces/editor";
import Viewport from "viewport";
import World from "world";
import Marking from "interfaces/marking";
import MarkingEditor from "./markingEditor";

export default class StopEditor extends MarkingEditor {
	public readonly type: EditorMode = EditorMode.STOP;

	constructor(public viewport: Viewport, public world: World) {
		super(viewport, world, world.laneGuides);
	}

	override createMarking(center: Point, directionVector: Point): Marking {
		return new Stop(
			center,
			directionVector,
			this.world.roadWidth / 2,
			this.world.roadWidth / 2
		);
	}
}
