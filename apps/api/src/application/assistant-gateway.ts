export interface AssistantGateway {
  isAvailable(): boolean;
  ask(question: string, context: string): Promise<string>;
}
