import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAssist } from "../hooks/useAssist";

export const AssistChat = () => {
  const { messages, sendMutation, meta, isLoading } = useAssist();
  const [draft, setDraft] = useState("");

  return (
    <LinearGradient colors={["#0c122c", "#0f1838"]} style={styles.screen}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[styles.message, item.role === "assistant" ? styles.assistant : styles.user]}
          >
            <Text style={styles.messageRole}>{item.role === "assistant" ? "Assist" : "You"}</Text>
            <Text style={styles.messageContent}>{item.content}</Text>
            {item.toolInvocations?.length ? (
              <View style={styles.tools}>
                {item.toolInvocations.map((tool) => (
                  <Text key={tool.tool} style={styles.toolBadge}>
                    {tool.tool} · {tool.latencyMs}ms
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={styles.metaSection}>
            <Text style={styles.metaHeading}>Quick context</Text>
            {isLoading ? (
              <Text style={styles.metaCopy}>Loading insights…</Text>
            ) : (
              <>
                <Text style={styles.metaCopy}>{meta.allocations.length} active allocations.</Text>
                <Text style={styles.metaCopy}>
                  Top articles: {meta.kbHits.map((hit) => hit.title).join(", ")}
                </Text>
              </>
            )}
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Ask how to reconcile payments"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={draft}
          onChangeText={setDraft}
          editable={!sendMutation.isPending}
        />
        <Pressable
          style={({ pressed }) => [styles.sendButton, pressed && styles.sendButtonPressed]}
          onPress={async () => {
            if (!draft.trim()) return;
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            sendMutation.mutate(draft.trim());
            setDraft("");
          }}
          disabled={sendMutation.isPending}
        >
          <Text style={styles.sendText}>{sendMutation.isPending ? "…" : "Send"}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  message: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    gap: 6,
  },
  assistant: {
    backgroundColor: "rgba(103,126,235,0.16)",
  },
  user: {
    backgroundColor: "rgba(12,18,42,0.7)",
  },
  messageRole: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(220,230,255,0.7)",
  },
  messageContent: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
  },
  tools: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  toolBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(140,170,255,0.22)",
    color: "#FFFFFF",
    fontSize: 12,
  },
  metaSection: {
    marginBottom: 16,
    gap: 6,
  },
  metaHeading: {
    color: "rgba(225,233,255,0.9)",
    fontWeight: "700",
    fontSize: 16,
  },
  metaCopy: {
    color: "rgba(225,233,255,0.75)",
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(9,12,28,0.95)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(16,24,52,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    color: "#FFFFFF",
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(126,150,255,0.92)",
  },
  sendButtonPressed: {
    backgroundColor: "rgba(126,150,255,1)",
  },
  sendText: {
    color: "#040717",
    fontWeight: "700",
  },
});
