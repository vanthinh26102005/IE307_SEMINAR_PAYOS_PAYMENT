import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const BACKEND_URL = 'http://localhost:4000';

type Order = {
  orderCode: number;
  status?: string;
  amount?: number;
  description?: string;
  transactionId?: string;
  paymentLinkId?: string;
  createdAt?: string;
  webhookReceivedAt?: string;
  transactionDateTime?: string;
  reference?: string;
  [key: string]: any;
};

export default function AdminScreen() {
  const { orderCode } = useLocalSearchParams<{ orderCode?: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount?: number) =>
    typeof amount === 'number'
      ? amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
      : '—';

  const loadOrders = useCallback(
    async (highlightCode?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/payment/orders`);
        const data = await res.json();
        const list: Order[] = Array.isArray(data) ? data : data.orders || [];
        setOrders(list);

        const codeToFind = highlightCode || (orderCode ? String(orderCode) : undefined);
        if (codeToFind) {
          const match = list.find((o) => String(o.orderCode) === String(codeToFind));
          if (match) {
            setSelectedOrder(match);
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Không tải được danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    },
    [orderCode],
  );

  const loadOrderDetail = useCallback(async (code: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/payment/orders/${code}`);
      if (!res.ok) {
        return;
      }
      const data: Order = await res.json();
      setSelectedOrder(data);
    } catch (err) {
      // ignore detail error, list already shown
    }
  }, []);

  useEffect(() => {
    loadOrders(orderCode ? String(orderCode) : undefined);
    if (orderCode) {
      loadOrderDetail(String(orderCode));
    }
  }, [loadOrderDetail, loadOrders, orderCode]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders(selectedOrder ? String(selectedOrder.orderCode) : undefined);
    setRefreshing(false);
  }, [loadOrders, selectedOrder]);

  const statusColor = (status?: string) => {
    if (!status) return '#999';
    const normalized = status.toUpperCase();
    if (normalized.includes('PAID') || normalized === '00' || normalized.includes('SUCCESS')) {
      return '#2ecc71';
    }
    if (normalized.includes('PENDING')) return '#f5a623';
    return '#e74c3c';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Theo dõi trạng thái thanh toán PayOS</Text>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.endpointCard}>
          <Text style={styles.endpointMethodPost}>POST</Text>
          <View style={styles.endpointBody}>
            <Text style={styles.endpointTitle}>/payment/create-order</Text>
            <Text style={styles.endpointDesc}>Nhận amount, description</Text>
            <Text style={styles.endpointDesc}>Tạo order (PENDING) trong DB</Text>
            <Text style={styles.endpointDesc}>Gọi SDK PayOS → trả về checkoutUrl</Text>
          </View>
        </View>
        <View style={styles.endpointCard}>
          <Text style={styles.endpointMethodPost}>POST</Text>
          <View style={styles.endpointBody}>
            <Text style={styles.endpointTitle}>/payment/payos-webhook</Text>
            <Text style={styles.endpointDesc}>Nhận dữ liệu từ PayOS</Text>
            <Text style={styles.endpointDesc}>Verify signature bằng CHECKSUM_KEY</Text>
            <Text style={styles.endpointDesc}>Cập nhật order: SUCCESS / FAILED</Text>
          </View>
        </View>
        <View style={styles.endpointCard}>
          <Text style={styles.endpointMethodGet}>GET</Text>
          <View style={styles.endpointBody}>
            <Text style={styles.endpointTitle}>/payment/order-status</Text>
            <Text style={styles.endpointDesc}>App RN gọi để biết trạng thái đơn</Text>
          </View>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && !orders.length ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#5c4ad6" />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
            {orders.length === 0 ? (
              <Text style={styles.empty}>Chưa có đơn hàng nào.</Text>
            ) : (
              orders.map((order) => (
                <TouchableOpacity
                  key={order.orderCode}
                  style={[
                    styles.orderCard,
                    selectedOrder?.orderCode === order.orderCode && styles.orderCardActive,
                  ]}
                  onPress={() => {
                    setSelectedOrder(order);
                    loadOrderDetail(String(order.orderCode));
                  }}
                >
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderCode}>#{order.orderCode}</Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: statusColor(order.status) + '20' },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: statusColor(order.status) }]}>
                        {order.status || 'UNKNOWN'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.orderDesc}>{order.description || 'Không có mô tả'}</Text>
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderAmount}>{formatCurrency(order.amount)}</Text>
                    <Text style={styles.orderDate}>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString('vi-VN')
                        : '—'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {selectedOrder ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chi tiết đơn #{selectedOrder.orderCode}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Trạng thái</Text>
                <Text style={[styles.detailValue, { color: statusColor(selectedOrder.status) }]}>
                  {selectedOrder.status || 'UNKNOWN'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Số tiền</Text>
                <Text style={styles.detailValue}>{formatCurrency(selectedOrder.amount)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mô tả</Text>
                <Text style={styles.detailValue}>{selectedOrder.description || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference</Text>
                <Text style={styles.detailValue}>
                  {selectedOrder.transactionId || selectedOrder.reference || '—'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Link ID</Text>
                <Text style={styles.detailValue}>{selectedOrder.paymentLinkId || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Thời gian thanh toán</Text>
                <Text style={styles.detailValue}>
                  {selectedOrder.transactionDateTime ||
                    (selectedOrder.webhookReceivedAt
                      ? new Date(selectedOrder.webhookReceivedAt).toLocaleString('vi-VN')
                      : '—')}
                </Text>
              </View>
              <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.refreshText}>Làm mới</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.empty}>Chọn một đơn để xem chi tiết.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cardRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  endpointCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8eef5',
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  endpointMethodPost: {
    backgroundColor: '#ffefde',
    color: '#d97706',
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 50,
    textAlign: 'center',
  },
  endpointMethodGet: {
    backgroundColor: '#e6f4ff',
    color: '#1b6fb8',
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 50,
    textAlign: 'center',
  },
  endpointBody: {
    flex: 1,
  },
  endpointTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#137a6e',
    marginBottom: 4,
  },
  endpointDesc: {
    color: '#455463',
    marginBottom: 2,
  },
  scroll: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 10,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderCardActive: {
    borderColor: '#5c4ad6',
    shadowOpacity: 0.1,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderDesc: {
    marginTop: 8,
    color: '#555',
  },
  orderFooter: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5c4ad6',
  },
  orderDate: {
    fontSize: 12,
    color: '#888',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    color: '#555',
    fontWeight: '600',
  },
  detailValue: {
    color: '#1f1f1f',
    maxWidth: '60%',
    textAlign: 'right',
  },
  refreshButton: {
    marginTop: 16,
    backgroundColor: '#5c4ad6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  refreshText: {
    color: '#fff',
    fontWeight: '700',
  },
  empty: {
    color: '#777',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 10,
  },
});
