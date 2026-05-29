import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#000000",
    minHeight: "100%",
  },

  header: {
    height: 82,
    backgroundColor: "#000000",
    paddingHorizontal: 28,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logoContainer: {
    width: 190,
    height: 60,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  logoImage: {
    width: 190,
    height: 60,
  },

  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 22,
  },

  navText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },

  hero: {
    minHeight: 520,
    backgroundColor: "#111820",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#1B263B",
  },

  heroSmall: {
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 15,
    opacity: 0.85,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 58,
    fontWeight: "300",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 14,
  },

  heroSubtitle: {
    color: "#FFFFFF",
    fontSize: 19,
    textAlign: "center",
    opacity: 0.9,
    marginBottom: 35,
  },

  heroButtons: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  primaryButton: {
    backgroundColor: "#C1121F",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 12,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  outlineButton: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 12,
  },

  outlineButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  section: {
    paddingHorizontal: 30,
    paddingVertical: 55,
    alignItems: "center",
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 43,
    fontWeight: "300",
    textAlign: "center",
    marginBottom: 18,
  },

  sectionDescription: {
    color: "#FFFFFF",
    opacity: 0.9,
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
    maxWidth: 780,
  },

  creditCard: {
    marginTop: 35,
    backgroundColor: "#081C2D",
    borderWidth: 1,
    borderColor: "#1D3557",
    padding: 28,
    borderRadius: 20,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },

  creditLabel: {
    color: "#FFFFFF",
    opacity: 0.8,
    fontSize: 16,
  },

  creditValue: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "700",
    marginVertical: 8,
  },

  creditNote: {
    color: "#A8DADC",
    fontSize: 15,
  },

  programGrid: {
    width: "100%",
    maxWidth: 980,
    marginTop: 35,
    gap: 18,
  },

  programCard: {
    backgroundColor: "#080808",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 18,
    padding: 24,
  },

  programTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },

  programText: {
    color: "#FFFFFF",
    opacity: 0.85,
    fontSize: 16,
    lineHeight: 24,
  },

  formSection: {
    paddingHorizontal: 28,
    paddingVertical: 45,
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },

  screenTitle: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "300",
    marginBottom: 12,
    textAlign: "center",
  },

  screenSubtitle: {
    color: "#FFFFFF",
    opacity: 0.85,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 28,
  },

  input: {
    backgroundColor: "#101010",
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    fontSize: 16,
  },

  serviceCard: {
    backgroundColor: "#080808",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 20,
    padding: 24,
    marginBottom: 18,
  },

  servicePerson: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },

  serviceName: {
    color: "#A8DADC",
    fontSize: 18,
    marginBottom: 12,
  },

  serviceDetail: {
    color: "#FFFFFF",
    opacity: 0.85,
    fontSize: 16,
    marginBottom: 6,
  },

  serviceCost: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
  },

  contactButton: {
    backgroundColor: "#1D3557",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 16,
  },

  backButton: {
    alignItems: "center",
    marginTop: 20,
  },

  backButtonText: {
    color: "#A8DADC",
    fontSize: 15,
    fontWeight: "700",
  },

  profileCard: {
    backgroundColor: "#080808",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 20,
    padding: 26,
  },

  profileName: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },

  profileLine: {
    color: "#FFFFFF",
    opacity: 0.9,
    fontSize: 16,
    marginBottom: 8,
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 10,
  },

  chatSection: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 35,
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },

  chatBox: {
    flex: 1,
    marginVertical: 20,
  },

  messageBubble: {
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    maxWidth: "82%",
  },

  myMessage: {
    backgroundColor: "#1D3557",
    alignSelf: "flex-end",
  },

  otherMessage: {
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "#333",
    alignSelf: "flex-start",
  },

  messageSender: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 5,
  },

  messageText: {
    color: "#FFFFFF",
    fontSize: 15,
  },

  dangerButton: {
    backgroundColor: "#6A040F",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
  },

  filterRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 16,
  },

  filterButton: {
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#080808",
  },

  filterButtonActive: {
    backgroundColor: "#C1121F",
    borderColor: "#C1121F",
  },

  filterButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  filterButtonTextActive: {
    color: "#FFFFFF",
  },

  resultCount: {
    color: "#A8DADC",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 16,
  },

  emptyStateCard: {
    backgroundColor: "#080808",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 20,
    padding: 24,
    marginTop: 10,
  },

  emptyStateTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },

  emptyStateText: {
    color: "#FFFFFF",
    opacity: 0.85,
    fontSize: 16,
    lineHeight: 24,
  },

  confirmButton: {
    backgroundColor: "#C1121F",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 12,
  },

  confirmCard: {
    backgroundColor: "#080808",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 20,
    padding: 24,
    marginBottom: 18,
  },

  historyCard: {
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  historyDescription: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },

  historyMeta: {
    color: "#A8DADC",
    fontSize: 14,
  },

  statsGrid: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },

  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "#080808",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
  },

  statLabel: {
    color: "#FFFFFF",
    opacity: 0.8,
    fontSize: 14,
    marginBottom: 8,
  },

  statValue: {
    color: "#A8DADC",
    fontSize: 30,
    fontWeight: "700",
  },

  requestCard: {
    backgroundColor: "#080808",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 20,
    padding: 24,
    marginBottom: 18,
  },

  requestStatus: {
    color: "#A8DADC",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 12,
  },

  outlineActionButton: {
    borderWidth: 1,
    borderColor: "#A8DADC",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 12,
  },

  outlineActionButtonText: {
    color: "#A8DADC",
    fontSize: 15,
    fontWeight: "700",
  },

  reviewCard: {
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  reviewRating: {
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 6,
  },

  reviewComment: {
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 6,
  },

  conversationCard: {
    backgroundColor: "#080808",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },

  conversationName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  conversationPreview: {
    color: "#CCCCCC",
    fontSize: 15,
    marginBottom: 8,
  },

  notificationCard: {
    backgroundColor: "#080808",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },

  notificationCardUnread: {
    borderColor: "#A8DADC",
  },

  notificationTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },

  notificationMessage: {
    color: "#CCCCCC",
    fontSize: 15,
    marginBottom: 8,
  },

  shortcutGrid: {
    width: "100%",
    gap: 12,
    marginTop: 12,
    marginBottom: 20,
  },

  shortcutCard: {
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 16,
    padding: 16,
  },

  shortcutTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },

  shortcutDescription: {
    color: "#CCCCCC",
    fontSize: 14,
    lineHeight: 21,
  },

  avatar: {
  width: 62,
  height: 62,
  borderRadius: 31,
},

serviceHeader: {
  flexDirection: "row",
  alignItems: "center",
  gap: 14,
  marginBottom: 18,
},

ratingText: {
  color: "#FFD166",
  fontSize: 15,
  fontWeight: "700",
},



});