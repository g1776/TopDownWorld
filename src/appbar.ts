import Editor from "./interfaces/editor";
import { EditorMode } from "./enums";
import World from "world";

export default class Appbar {
	// set the default mode here
	private mode: EditorMode = EditorMode.GRAPH;
	private treesEnabled: boolean = false;

	constructor(public editors: Editor[], private world: World) {
		this.setEditorMode(this.mode);
		this.addEventListeners();
	}

	private save() {
		this.editors.forEach((editor) => editor.save());
	}

	private dispose() {
		const response = confirm(
			"Are you sure you want to clear? Any unsaved progress will be lost."
		);
		console.log(response);
		if (!response) return;
		this.editors.forEach((editor) => editor.dispose(false));
	}

	private toggleTrees(enabled: boolean) {
		if (enabled) {
			this.world.enableTrees();
		} else {
			this.world.disableTrees();
		}
	}

	/**
	 * Sets the mode of the controls.
	 * @param mode - The mode to set.
	 */
	private setEditorMode(mode: EditorMode) {
		// update the button styling
		const modeBtns = document.getElementById("mode-btns")
			?.children as HTMLCollectionOf<HTMLButtonElement>;
		for (const btn of modeBtns) {
			if (btn.value === mode) {
				btn.classList.add("selected");
			} else {
				btn.classList.remove("selected");
			}
		}

		// enable/disable the appropriate editors
		this.editors.forEach((editor) => {
			if (editor.type === mode) {
				editor.enable();
			} else {
				editor.disable();
			}
		});

		this.mode = mode;
	}

	private addEventListener(id: string, callback: any) {
		const element = document.getElementById(id);
		if (element) {
			element.addEventListener("click", callback.bind(this));
		}
	}

	private addEventListeners() {
		this.addEventListener("action-btn-dispose", this.dispose);
		this.addEventListener("action-btn-save", this.save);
		this.addEventListener("mode-btn-graph", () => this.setEditorMode(EditorMode.GRAPH));
		this.addEventListener("mode-btn-stop", () => this.setEditorMode(EditorMode.STOP));
		this.addEventListener("mode-btn-view-only", () =>
			this.setEditorMode(EditorMode.VIEW_ONLY)
		);
		this.addEventListener("checkbox-tree-toggle", () => {
			this.treesEnabled = !this.treesEnabled;
			this.toggleTrees(this.treesEnabled);
		});
	}
}
