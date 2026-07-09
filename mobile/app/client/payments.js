import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { paymentService } from "../../services/api.service";
import { ArrowLeft, Clock, CheckCircle, CreditCard, User, XCircle } from "lucide-react-native";

export default function ClientPaymentHistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await paymentService.getMyPayments();
      setHistory(data);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, []);

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const renderItem = ({ item }) => {
    const isPending = item.paymentStatus === "pending_acceptance";
    const isAccepted = item.paymentStatus === "accepted";
    const fileName = item.originalName || "Secure File";
    
    const getBadgeStyle = () => {
      if (isPending) return styles.badgePending;
      if (isAccepted) return styles.badgeAccept;
      return styles.badgeReject;
    };
    
    const getTextStyle = () => {
      if (isPending) return styles.textPending;
      if (isAccepted) return styles.textAccept;
      return styles.textReject;
    };

    const getStatusText = () => {
      if (isPending) return "Pending";
      if (isAccepted) return "Completed";
      return "Refunded / Rejected";
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.cardIconWrap, isPending ? styles.iconPending : isAccepted ? styles.iconAccept : styles.iconReject]}>
            {isPending ? <Clock size={22} color="#f59e0b" /> : isAccepted ? <CheckCircle size={22} color="#10b981" /> : <XCircle size={22} color="#ef4444" />}
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardAmount}>${item.price?.toFixed(2)}</Text>
            <Text style={styles.cardFile} numberOfLines={1}>{fileName}</Text>
          </View>
          <View style={[styles.statusBadge, getBadgeStyle()]}>
            <Text style={[styles.statusText, getTextStyle()]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        
        <View style={styles.clientRow}>
          <User size={14} color="#64748b" />
          <Text style={styles.clientText}>To: <Text style={styles.clientName}>{item.uploadedBy?.name || "Freelancer"}</Text></Text>
        </View>
        <View style={styles.dateRow}>
          <Clock size={14} color="#64748b" />
          <Text style={styles.dateText}>{formatTime(item.paidAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Payments</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0d9488" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} tintColor="#0d9488" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <CreditCard size={52} color="#1e293b" />
              <Text style={styles.emptyTitle}>No Payments</Text>
              <Text style={styles.emptySubtext}>Files you have paid for will appear here.</Text>
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
  card: {
    backgroundColor: "#1e293b", borderRadius: 20, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: "#334155",
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  cardIconWrap: {
    width: 46, height: 46, borderRadius: 12,
    justifyContent: "center", alignItems: "center", marginRight: 14,
  },
  iconPending: { backgroundColor: "rgba(245,158,11,0.1)" },
  iconAccept: { backgroundColor: "rgba(16,185,129,0.1)" },
  iconReject: { backgroundColor: "rgba(239,68,68,0.1)" },
  cardInfo: { flex: 1 },
  cardAmount: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  cardFile: { color: "#64748b", fontSize: 13, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12, borderWidth: 1,
  },
  badgePending: { backgroundColor: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)" },
  badgeAccept: { backgroundColor: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.3)" },
  badgeReject: { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" },
  statusText: { fontSize: 11, fontWeight: "bold" },
  textPending: { color: "#f59e0b" },
  textAccept: { color: "#10b981" },
  textReject: { color: "#ef4444" },
  clientRow: {
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8,
  },
  clientText: { color: "#64748b", fontSize: 14 },
  clientName: { color: "#fff", fontWeight: "600" },
  dateRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  dateText: { color: "#94a3b8", fontSize: 13 },
  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { color: "#475569", fontSize: 18, fontWeight: "bold", marginTop: 20 },
  emptySubtext: { color: "#334155", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 22 },
});
