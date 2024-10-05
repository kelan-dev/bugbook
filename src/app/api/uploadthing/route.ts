import { createRouteHandler } from "uploadthing/next";
import { fileRouter } from "./core";

// Create endpoints for Uploadthing
export const { GET, POST } = createRouteHandler({
  router: fileRouter,
});
