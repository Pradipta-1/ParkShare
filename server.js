require("dotenv").config();

// Load the ParkShare API server connected to MongoDB Atlas
import("./server/dist/server.js")
  .then(() => {
    console.log("⚡ ParkShare full API server & MongoDB Atlas successfully loaded.");
  })
  .catch((err) => {
    console.error("Loading compiled server failed, falling back to tsx runner:", err.message);
    const { spawn } = require("child_process");
    const child = spawn("npx", ["tsx", "server/src/server.ts"], {
      stdio: "inherit",
      shell: true,
    });
    child.on("error", (e) => console.error("Process error:", e));
  });
