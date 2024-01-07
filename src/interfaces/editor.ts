import { EditorMode } from "enums";

export default interface Editor {
	type: EditorMode;
	dispose(): void;
	save(): void;
	enable(): void;
	disable(): void;
	isEnabled(): boolean;
	display(): void;
}
