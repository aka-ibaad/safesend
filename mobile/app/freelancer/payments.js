import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { paymentService } from "../../services/api.service";
import { ArrowLeft, Clock, Check, X, CreditCard, User, History } from "lucide-react-native";

export default function FreelancerPaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const router = useRouter();

  const fetchPayments = useCallback(async () => {
    try {
      const { data } = await paymentService.getPendingPayments();
      setPayments(data);
    } catch (err) {
      Alert.alert("Error", "Could not load pending payments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, []);

  const handleAccept = async (item) => {
    setProcessingId(item._id);
    try {
      await paymentService.confirmPayment(item.paymentIntentId);
      Alert.alert(
        "Payment Accepted!",
        "$" + item.price?.toFixed(2) + " from " + (item.paidBy?.name || "Client") + " has been accepted. The file is now unlocked.",
        [{ text: "Done", onPress: fetchPayments }]
      );
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to accept payment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (item) => {
    Alert.alert(
      "Reject Payment?",
      "This will refund " + (item.paidBy?.name || "the client") + " and re-lock the file. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject", style: "destructive",
          onPress: async () => {
            setProcessingId(item._id);
            try {
              await paymentService.rejectPayment(item._id);
              fetchPayments();
            } catch (err) {
              Alert.alert("Error", "Failed to reject payment");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + "m ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.floor(hrs / 24) + "d ago";
  };

  const renderItem = ({ item }) => {
    const isProcessing = processingId === item._id;
    const fileName = item.originalName || "Secure File";
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardIconWrap}>
            <CreditCard size={22} color="#3b82f6" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardAmount}>${item.price?.toFixed(2)}</Text>
            <Text style={styles.cardFile} numberOfLines={1}>{fileName}</Text>
          </View>
          <View style={styles.timeBadge}>
            <Clock size={12} color="#f59e0b" />
            <Text style={styles.timeText}>{formatTime(item.paidAt)}</Text>
          </View>
        </View>
        <View style={styles.clientRow}>
          <User size={14} color="#64748b" />
          <Text style={styles.clientText}>From: <Text style={styles.clientName}>{item.paidBy?.name || "Unknown Client"}</Text></Text>
        </View>
        {isProcessing ? (
          <View style={styles.processingRow}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
              <X size={18} color="#ef4444" />
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}>
              <Check size={18} color="#fff" />
              <Text style={styles.acceptText}>Accept Payment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incoming Payments</Text>
        <TouchableOpacity onPress={() => router.push('/freelancer/history')} style={styles.backBtn}>
          <History color="#94a3b8" size={24} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayments(); }} tintColor="#3b82f6" />}
          ListHeaderComponent={payments.length > 0 ? (
            <View style={styles.summaryBanner}>
              <Text style={styles.summaryNum}>{payments.length}</Text>
              <Text style={styles.summaryLabel}>Pending Payment{payments.length !== 1 ? "s" : ""}</Text>
            </View>
          ) : null}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <CreditCard size={52} color="#1e293b" />
              <Text style={styles.emptyTitle}>No Pending Payments</Text>
              <Text style={styles.emptySubtext}>When clients pay for your files, they will appear here for you to accept.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: "#1e293b",
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  list: { padding: 20, paddingBottom: 40 },
  summaryBanner: {
    backgroundColor: "#3b82f6", borderRadius: 20, padding: 20, alignItems: "center", marginBottom: 20,
    shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
  },
  summaryNum: { color: "#fff", fontSize: 40, fontWeight: "bold" },
  summaryLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: "#1e293b", borderRadius: 20, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: "#334155",
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardIconWrap: {
    width: 46, height: 46, borderRadius: 12, backgroundColor: "rgba(59,130,246,0.1)",
    justifyContent: "center", alignItems: "center", marginRight: 14,
  },
  cardInfo: { flex: 1 },
  cardAmount: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  cardFile: { color: "#64748b", fontSize: 13, marginTop: 2 },
  timeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(245,158,11,0.1)", paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(245,158,11,0.3)",
  },
  timeText: { color: "#f59e0b", fontSize: 11, fontWeight: "600" },
  clientRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingBottom: 14, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: "#334155",
  },
  clientText: { color: "#64748b", fontSize: 14 },
  clientName: { color: "#fff", fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 10 },
  rejectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: "#ef4444",
    backgroundColor: "rgba(239,68,68,0.08)",
  },
  rejectText: { color: "#ef4444", fontWeight: "700", fontSize: 14 },
  acceptBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 50, borderRadius: 14, backgroundColor: "#10b981",
    shadowColor: "#10b981", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  acceptText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  processingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 50 },
  processingText: { color: "#64748b", fontSize: 14 },
  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { color: "#475569", fontSize: 18, fontWeight: "bold", marginTop: 20 },
  emptySubtext: { color: "#334155", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 22 },
});
