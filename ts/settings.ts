class Settings {
	// Program settings
	public static readonly DEBUG: boolean = false;

	// Road settings
	public static readonly ROAD_WIDTH: number = 100;
	public static readonly ROAD_ROUNDNESS: number = 30;

	// Tree settings
	public static readonly TREE_RADIUS: number = 100;
	public static readonly TREE_HEIGHT: number = 0.15;

	/**
	 * Scale the algorithm that determines how many trees to place. Higher values will result in more trees. (0, Infinity)
	 */
	public static readonly TREE_COUNT_SCALE_FACTOR: number = 0.3;

	// Building settings
	public static readonly BUILDING_WIDTH: number = 150;
	public static readonly BUILDING_MIN_LENGTH: number = 150;
	public static readonly BUILDING_SPACING: number = 100;
	public static readonly BUILDING_HEIGHT: number = 0.1;
	public static readonly BUILDING_ROOF_HEIGHT: number = 0.05;
}
