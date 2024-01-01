# World Editor

Gregory Glatzer

Based on the [YouTube tutorial by Radu Mariescu-Istodor](https://www.youtube.com/watch?v=5iHejdqYIa8&t=10233s)

## Getting Started

```bash
npm install
npm start
```

## Contributing

Please use Prettier with the default settings to format your code.

Feel free to open an issue or submit a pull request to the `dev` branch.

## Improvements from the original series

-   Written in TypeScript + Webpack
-   Made more well-defined classes for the different types of objects along with interfaces.
-   Centralized all default values and other settings in a single file: `settings.ts`
-   Randomized building sizes
-   Trees only regenerate on new/modified segments.
-   Added a styled app bar
