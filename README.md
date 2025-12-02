# Deziper (MF24.cz)

Deziper is a specialized news reading platform designed for experimental and annotation purposes. It mimics a standard news website to conduct reading experiments and collect annotations regarding article credibility and manipulativeness.

## Features

- **News Interface**: A realistic news website layout with categories (Home, World, Health, Nature).
- **Article Reader**: A focused reading view with a carousel interface, adjustable font size, and line height.
- **Experiment Mode**: A controlled environment where participants read a specific sequence of articles.
- **Annotation Mode**: A dedicated interface for annotators to evaluate articles based on credibility and manipulativeness.
- **Data Collection**: Automatically saves user interactions, answers to questions, ratings, and reading times.

## Tech Stack

- **Framework**: [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Runtime/Package Manager**: [Bun](https://bun.sh/)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or later) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mf24.cz
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

### Running Locally

Start the development server:

```bash
bun run dev
```

The application will be available at `http://localhost:8080`.

To enable the **Experiment Mode** button on the home screen locally, run:

```bash
ENV_NAME=experiment bun run dev
```

## Deployment

The application requires a server-side component to handle data saving (implemented via Vite middleware). Therefore, it cannot be hosted on static hosting services (like GitHub Pages or Netlify) without a backend.

### Using Docker (Recommended)

We provide scripts to easily package and run the application using Docker.

1.  **Build and Package** (on your development machine):
    ```bash
    ./package-app.sh
    ```
    This creates a `mf24-app.tar` file containing the Docker image (built for linux/amd64).

2.  **Run** (on the target server):
    Transfer `mf24-app.tar` and `run-app.sh` to your server and run:
    ```bash
    ./run-app.sh
    ```
    The application will start on port `8080`.

### Manual Deployment

If you prefer running it directly with Bun on a server:

1.  Build the application:
    ```bash
    bun run build
    ```
2.  Run the preview server (which handles the API):
    ```bash
    ENV_NAME=experiment bun run preview -- --host 0.0.0.0 --port 8080
    ```

## Data Storage

All annotations and experiment data are stored in a JSON file located at:

```
data-records/annotations.json
```

This file is automatically created when the first data is saved.
- **Docker**: The `data-records` folder is mounted as a volume, so data persists even if the container is removed.
- **Local/Manual**: The folder is created in the project root.

## Environment Variables

- `ENV_NAME`: Set to `experiment` to enable the "Experiment" button on the home screen. If not set, only "Annotate" mode is available.

## Project Structure

- `src/pages`: Main application pages (Index, ArticleDetail, etc.).
- `src/components`: Reusable UI components.
- `src/data`: Static news data.
- `src/context`: React contexts for managing experiment state.
- `vite.config.ts`: Vite configuration including the **middleware for saving data**.
