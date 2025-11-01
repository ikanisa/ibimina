import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  AIAgent,
  EmbeddingIngestionPipeline,
  InMemoryVectorStore,
  KnowledgeBaseResolver,
  type KnowledgeDocumentInput,
} from "../src/index.js";

class DeterministicEmbeddingProvider {
  constructor(private readonly seed: number) {}

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.textToVector(text));
  }

  private textToVector(text: string): number[] {
    const length = 12;
    const vector = new Array<number>(length).fill(0);
    for (let index = 0; index < text.length; index += 1) {
      const code = text.charCodeAt(index) + this.seed * 17;
      vector[index % length] += code / 255;
    }

    const magnitude = Math.sqrt(vector.reduce((total, value) => total + value * value, 0));
    return magnitude === 0 ? vector : vector.map((value) => value / magnitude);
  }
}

describe("AI Agent knowledge base pipeline", () => {
  const orgId = "org-123";
  let store: InMemoryVectorStore;

  beforeEach(() => {
    store = new InMemoryVectorStore();
  });

  it("ingests documents and stores chunk embeddings", async () => {
    const documents: KnowledgeDocumentInput[] = [
      {
        orgId,
        title: "Member Onboarding Guide",
        sourceType: "manual",
        sourceUri: "https://kb.example.com/onboarding",
        content:
          "Welcome to the SACCO onboarding guide. Collect member identification, verify references, and " +
          "record initial savings. When a member completes training, update their profile to unlock the " +
          "full digital banking toolkit. Regularly remind members about savings automation options and USSD" +
          " access.",
      },
    ];

    const pipeline = new EmbeddingIngestionPipeline(store, new DeterministicEmbeddingProvider(1), {
      chunkSize: 120,
      chunkOverlap: 20,
      batchSize: 2,
    });

    const results = await pipeline.ingest(documents);
    assert.equal(results.length, 1);
    assert.equal(results[0]?.status, "completed");

    const stored = await store.listDocuments();
    assert.equal(stored.length, 1);
    const chunks = await store.getDocumentChunks(stored[0]!.id);
    assert.ok(chunks.length >= 2, "documents should be chunked for embeddings");
    assert.ok(chunks.every((chunk) => chunk.embedding.length > 0));
  });

  it("reindexes existing chunks with fresh embeddings", async () => {
    const pipeline = new EmbeddingIngestionPipeline(store, new DeterministicEmbeddingProvider(2), {
      chunkSize: 100,
      chunkOverlap: 10,
    });

    await pipeline.ingest([
      {
        orgId,
        title: "Loan Recovery Playbook",
        sourceType: "policy",
        content:
          "When a loan repayment is overdue, contact the member, schedule a follow-up, and escalate to the " +
          "credit committee if no action occurs within seven days. Document every conversation in the support " +
          "workspace to maintain visibility.",
      },
    ]);

    const documentId = (await store.listDocuments())[0]!.id;
    const before = await store.getDocumentChunks(documentId);

    const reindexPipeline = new EmbeddingIngestionPipeline(
      store,
      new DeterministicEmbeddingProvider(6),
      {
        chunkSize: 100,
        chunkOverlap: 10,
      }
    );

    const summary = await reindexPipeline.reindex({ documentIds: [documentId] });
    const after = await store.getDocumentChunks(documentId);

    assert.equal(summary.documentCount, 1);
    assert.equal(summary.totalChunks, after.length);
    assert.notDeepEqual(
      after.map((chunk) => chunk.embedding),
      before.map((chunk) => chunk.embedding),
      "reindex should replace embeddings"
    );
  });

  it("resolves vector matches with high similarity", async () => {
    const provider = new DeterministicEmbeddingProvider(3);
    const pipeline = new EmbeddingIngestionPipeline(store, provider, {
      chunkSize: 90,
      chunkOverlap: 15,
    });

    await pipeline.ingest([
      {
        orgId,
        title: "Savings Automation FAQ",
        sourceType: "faq",
        content:
          "Members can enable automated savings by dialing *778#. Select option 3, choose preferred frequency, " +
          "and confirm with a PIN. Automated savings pause automatically when balances are insufficient.",
      },
    ]);

    const resolver = new KnowledgeBaseResolver(store, provider, { defaultMatchCount: 3 });
    const result = await resolver.search("How do members enable automated savings?", { orgId });

    assert.equal(result.source, "vector");
    assert.ok(result.matches.length > 0);
    assert.ok(result.matches[0]!.similarity > 0.5);
  });

  it("falls back to keyword search when embeddings fail", async () => {
    const pipeline = new EmbeddingIngestionPipeline(store, new DeterministicEmbeddingProvider(4), {
      chunkSize: 80,
      chunkOverlap: 10,
    });

    await pipeline.ingest([
      {
        orgId,
        title: "Escalation Policy",
        sourceType: "policy",
        content:
          "Escalate unresolved incidents to level-two support after 30 minutes. Provide conversation history, " +
          "member identifiers, and any troubleshooting notes to the responding agent.",
      },
    ]);

    const failingProvider = {
      async embed(): Promise<number[][]> {
        throw new Error("embedding offline");
      },
    };

    const resolver = new KnowledgeBaseResolver(store, failingProvider, { fallbackLimit: 2 });
    const result = await resolver.search("What is the escalation policy?", { orgId });

    assert.equal(result.source, "keyword");
    assert.ok(result.matches.length > 0);
  });

  it("returns contextual matches from the chat API", async () => {
    const provider = new DeterministicEmbeddingProvider(5);
    const pipeline = new EmbeddingIngestionPipeline(store, provider, {
      chunkSize: 100,
      chunkOverlap: 12,
    });

    await pipeline.ingest([
      {
        orgId,
        title: "PIN Reset Checklist",
        sourceType: "runbook",
        content:
          "To reset a member PIN, confirm identity, validate recovery contact, send the reset code, and record the " +
          "case number. Encourage members to update their PIN within 24 hours to maintain account security.",
      },
    ]);

    const agent = new AIAgent({
      embeddingProvider: provider,
      vectorStore: store,
      resolverOptions: { defaultMatchCount: 2 },
    });

    const response = await agent.chat({
      messages: [{ role: "user", content: "How can I reset a member PIN?" }],
      orgId,
    });

    assert.ok(response.message.includes("Top knowledge base matches"));
    assert.ok(response.matches && response.matches.length > 0);
    assert.equal(response.source, "vector");
  });
});
