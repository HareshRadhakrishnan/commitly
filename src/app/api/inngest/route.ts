import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processPush } from "@/inngest/functions/process-push";
import { indexRepo } from "@/inngest/functions/index-repo";
import { updateEmbeddings } from "@/inngest/functions/update-embeddings";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processPush, indexRepo, updateEmbeddings],
});
