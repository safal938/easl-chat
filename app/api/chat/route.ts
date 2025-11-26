import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { question, model_type, user_info } = await req.json();
    if (!question) {
      return new Response(JSON.stringify({ error: "Question is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const externalResponse = await fetch(
      process.env.NEXT_PUBLIC_EXTERNAL_API_URL ?? "",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, model_type: model_type || "auto", user_info }),
      }
    );

    if (!externalResponse.ok || !externalResponse.body) {
      const err = await externalResponse.text();
      console.error("External API Error:", err);
      return new Response(JSON.stringify({ error: err }), {
        status: externalResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const reader = externalResponse.body.getReader();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    let buffer = "";

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const rawLine of lines) {
            if (!rawLine.trim()) continue;

            let json: any;
            try {
              json = JSON.parse(rawLine);
            } catch {
              // Skip malformed SSE frames
              continue;
            }

            // FILTER OUT METADATA & PARTIALS - Don't send these to frontend
            if (shouldFilterMetadata(json)) continue;

            // Forward normalized payload down the SSE stream
            await handleStreamResponse(json, writer, encoder);
          }
        }

        // handle any leftover buffered line
        if (buffer.trim()) {
          try {
            const json = JSON.parse(buffer);
            if (!shouldFilterMetadata(json)) {
              await handleStreamResponse(json, writer, encoder);
            }
          } catch {
            /* ignore trailing junk */
          }
        }

        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "complete" })}\n\n`));
      } catch (e) {
        console.error("Stream processing error:", e);
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              content: "An error occurred while processing the response",
            })}\n\n`
          )
        );
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (e) {
    console.error("Route error:", e);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// FILTER FUNCTION - Decides what metadata to ignore
function shouldFilterMetadata(json: any): boolean {
  // Drop pipeline metadata types that aren't needed for UI
  const metadataTypes = [
    "pipeline_decision",
    "chunks_retrieved",
    "reasoning_start_meta",
    "pipeline_info",
  ];
  if (metadataTypes.includes(json.response_type)) return true;
  return false;
}

// Unified response handler for the new XML/JSON hybrid format -> SSE to client
async function handleStreamResponse(
  json: any,
  writer: WritableStreamDefaultWriter,
  encoder: TextEncoder
) {
  console.log("Processing response:", json.response_type, json);

  // Normalize safety flag to boolean (handles true/1/"1")
  const rawSafety = json.safety_flag ?? json.safetyRequired ?? json.safety;
  const safetyRequired = rawSafety === true || rawSafety === 1 || rawSafety === "1";

  await writer.write(
    encoder.encode(
      `data: ${JSON.stringify({
        response_type: json.response_type,
        expert_name: json.expert_name,
        response: json.response,
        timestamp: json.timestamp,
        // include the normalized flag so the frontend can react immediately
        safety_flag: safetyRequired,
      })}\n\n`
    )
  );
}
