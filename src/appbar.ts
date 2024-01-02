import Editor from "./interfaces/editor";
import { EditorMode } from "./enums";
import World from "world";
import { GraphEditor } from "editors";

export default class Appbar {
	// set the default mode here
	private mode: EditorMode = EditorMode.GRAPH;
	private treesEnabled: boolean = false;
	private gridEnabled: boolean = false;

	constructor(public editors: Editor[], private world: World) {
		this.setEditorMode(this.mode);
		this.addEventListeners();
	}

	public isGridEnabled(): boolean {
		return this.gridEnabled;
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

	private toggleGrid(enabled: boolean) {
		this.gridEnabled = enabled;
		const graphEditor = this.editors.find((e) => e.type === EditorMode.GRAPH) as GraphEditor;
		if (graphEditor) {
			if (enabled) {
				graphEditor.enableGrid();
			} else {
				graphEditor.disableGrid();
			}
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

	private setWorldTitle(title: string) {
		this.world.title = title;
	}

	private addClickListener(id: string, callback: any) {
		const element = document.getElementById(id);
		if (element) {
			element.addEventListener("click", callback.bind(this));
		}
	}

	private addEventListeners() {
		this.addClickListener("action-btn-dispose", this.dispose);
		this.addClickListener("action-btn-save", this.save);
		this.addClickListener("mode-btn-graph", () => this.setEditorMode(EditorMode.GRAPH));
		this.addClickListener("mode-btn-stop", () => this.setEditorMode(EditorMode.STOP));
		this.addClickListener("mode-btn-view-only", () =>
			this.setEditorMode(EditorMode.VIEW_ONLY)
		);
		this.addClickListener("tree-toggle", () => {
			this.treesEnabled = document.getElementById("tree-toggle")!.classList.toggle("active");
			this.toggleTrees(this.treesEnabled);
		});
		this.addClickListener("grid-toggle", () => {
			const gridEnabled = document.getElementById("grid-toggle")!.classList.toggle("active");
			this.toggleGrid(gridEnabled);
		});
		this.addClickListener("info", () =>
			alert("Created by Gregory Glatzer. Based on the tutorial by Radu on FreeCodeCamp.org")
		);
	}
}
