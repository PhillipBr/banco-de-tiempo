import { Text, View } from "react-native";

import { ChatMessage, useAppContext } from "../context/AppContext";
import { styles } from "../theme/styles";

type ChatBubbleProps = {
  message: ChatMessage;
};

export default function ChatBubble({ message }: ChatBubbleProps) {
  const { user } = useAppContext();

  const isMine = message.sender === user.name;

  return (
    <View
      style={[
        styles.messageBubble,
        isMine ? styles.myMessage : styles.otherMessage,
      ]}
    >
      <Text style={styles.messageSender}>{message.sender}</Text>
      <Text style={styles.messageText}>{message.text}</Text>
      <Text style={styles.historyMeta}>{message.date}</Text>
    </View>
  );
}