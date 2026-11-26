import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
} from "@aws-sdk/client-bedrock-runtime";
import type { AssistantGateway } from "../application/assistant-gateway";

const SYSTEM_PROMPT = [
  "You are a logistics operations analyst assistant.",
  "Answer the manager's question using ONLY the operational context provided.",
  "Never invent, estimate, or fabricate metrics that are not in the context.",
  "If the context does not contain enough information, say so explicitly.",
  "Be concise and factual. Do not recommend changes to records; you are read-only.",
].join(" ");

export class BedrockAssistantGateway implements AssistantGateway {
  private readonly client: BedrockRuntimeClient;

  constructor(
    private readonly modelId: string,
    region: string,
    client?: BedrockRuntimeClient,
  ) {
    this.client = client ?? new BedrockRuntimeClient({ region });
  }

  isAvailable(): boolean {
    return this.modelId.trim().length > 0;
  }

  async ask(question: string, context: string): Promise<string> {
    const messages: Message[] = [
      {
        role: "user",
        content: [{ text: `Operational context:\n${context}\n\nQuestion: ${question}` }],
      },
    ];
    const out = await this.client.send(
      new ConverseCommand({
        modelId: this.modelId,
        system: [{ text: SYSTEM_PROMPT }],
        messages,
        inferenceConfig: { maxTokens: 500, temperature: 0.2 },
      }),
    );
    const text = (out.output?.message?.content ?? [])
      .map((block) => ("text" in block && block.text ? block.text : ""))
      .join("")
      .trim();
    return text.length > 0 ? text : "No answer could be generated from the available data.";
  }
}
