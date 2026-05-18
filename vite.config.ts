import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import {
  deleteAnnotationsByAnnotator,
  exportCsv,
  getAllAnnotations,
  getAnnotationsByAnnotator,
  getLatestAnnotations,
  insertAnnotation,
} from "./server/annotationsDb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = "/api/save-annotation";

const saveAnnotationsMiddleware = (req: any, res: any, next: any) => {
  const rawUrl: string = req.url ?? "";
  const apiIdx = rawUrl.indexOf(API_BASE);
  if (apiIdx === -1) {
    return next();
  }
  const url = rawUrl.slice(apiIdx);

  const queryAnnotator = (() => {
    const qIdx = url.indexOf("?");
    if (qIdx === -1) return null;
    const params = new URLSearchParams(url.slice(qIdx + 1));
    const v = params.get("annotator")?.trim();
    return v && v.length > 0 ? v : null;
  })();

  if (req.method === "GET") {
    try {
      if (url.startsWith("/api/save-annotation/export")) {
        const csv = exportCsv(__dirname);
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="annotations.csv"',
        );
        res.end(csv);
        return;
      }
      let rows;
      if (url.startsWith("/api/save-annotation/all")) {
        rows = getAllAnnotations(__dirname);
      } else if (queryAnnotator) {
        rows = getAnnotationsByAnnotator(__dirname, queryAnnotator);
      } else {
        rows = getLatestAnnotations(__dirname);
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(rows));
    } catch (error) {
      console.error("[Vite Middleware] Error reading annotations:", error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
    return;
  }

  if (req.method === "DELETE") {
    try {
      if (!queryAnnotator) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Missing ?annotator=" }));
        return;
      }
      const deleted = deleteAnnotationsByAnnotator(__dirname, queryAnnotator);
      console.log(
        `[Vite Middleware] Deleted ${deleted} rows for annotator=${queryAnnotator}`,
      );
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: true, deleted }));
    } catch (error) {
      console.error("[Vite Middleware] Error deleting:", error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
    return;
  }

  if (req.method === "POST") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const items = Array.isArray(data) ? data : [data];
        let addedCount = 0;
        for (const item of items) {
          if (!item?.annotatorId || !item?.articleId) continue;
          insertAnnotation(__dirname, item);
          addedCount += 1;
        }
        console.log(
          `[Vite Middleware] Saved ${addedCount} annotation(s) to SQLite`,
        );
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ success: true, added: addedCount }));
      } catch (error) {
        console.error("[Vite Middleware] Error saving annotation:", error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });
    return;
  }

  next();
};

const saveAnnotationsPlugin = () => ({
  name: "save-annotations",
  configureServer(server: any) {
    server.middlewares.use(saveAnnotationsMiddleware);
  },
  configurePreviewServer(server: any) {
    server.middlewares.use(saveAnnotationsMiddleware);
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: "/deziper/",
    define: {
      "import.meta.env.ENV_NAME": JSON.stringify(env.ENV_NAME),
    },
    server: {
      host: "::",
      port: 8080,
    },
    preview: {
      allowedHosts: ["quest.ms.mff.cuni.cz"],
    },
    plugins: [
      react(),
      saveAnnotationsPlugin(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
