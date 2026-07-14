import { realtimeMiddleware } from "@inngest/realtime/middleware";
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "kryptonite",
  eventKey: process.env.INNGEST_EVENT_KEY ?? "local",
  middleware: [realtimeMiddleware()],
});
