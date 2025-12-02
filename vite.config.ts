import react from "@vitejs/plugin-react-swc";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom plugin to save annotations
const saveAnnotationsMiddleware = (req, res, next) => {
  const dataDir = path.resolve(__dirname, "data-records");
  const outputFile = path.join(dataDir, "annotations.json");

  if (req.url === "/api/save-annotation") {
    if (req.method === "GET") {
      // Handle retrieving annotations
      try {
        if (fs.existsSync(outputFile)) {
          const content = fs.readFileSync(outputFile, "utf8");
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(content);
        } else {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end("[]");
        }
      } catch (error) {
        console.error("[Vite Middleware] Error reading annotations:", error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
      return;
    }

    if (req.method === "POST") {
      console.log("[Vite Middleware] Received save request");
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          console.log("[Vite Middleware] Processing body...");
          const data = JSON.parse(body);

          if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
          }

          let existingData = [];
          if (fs.existsSync(outputFile)) {
            try {
              existingData = JSON.parse(fs.readFileSync(outputFile, "utf8"));
            } catch (e) {
              console.error(
                "[Vite Middleware] Error parsing existing annotations:",
                e
              );
            }
          }

          // Handle array or single object
          const newItems = Array.isArray(data) ? data : [data];
          let addedCount = 0;

          for (const item of newItems) {
            const isDuplicate = existingData.some(
              (existing) =>
                existing.annotatorId === item.annotatorId &&
                existing.articleId === item.articleId
            );
            if (!isDuplicate) {
              existingData.push(item);
              addedCount++;
            }
          }

          if (addedCount > 0) {
            fs.writeFileSync(outputFile, JSON.stringify(existingData, null, 2));
            console.log(
              `[Vite Middleware] Saved ${addedCount} annotation(s) to ${outputFile}`
            );
          } else {
            console.log(
              "[Vite Middleware] No new annotations to save (duplicates)."
            );
          }

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
  }

  next();
};

const saveAnnotationsPlugin = () => ({
  name: "save-annotations",
  configureServer(server) {
    server.middlewares.use(saveAnnotationsMiddleware);
  },
  configurePreviewServer(server) {
    server.middlewares.use(saveAnnotationsMiddleware);
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: "/deziper",
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
