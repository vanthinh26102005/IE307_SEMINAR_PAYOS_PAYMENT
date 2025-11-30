import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  Alert, 
  Linking, 
  ActivityIndicator, 
  SafeAreaView,
  StatusBar 
} from 'react-native';

// --- CẤU HÌNH ---
// Hãy đổi IP này thành IP máy tính của bạn nếu chạy trên điện thoại thật (VD: 192.168.1.x)
const BACKEND_URL = 'http://localhost:4000'; 
// const BACKEND_URL = 'http://10.0.2.2:4000'; // Dùng dòng này nếu chạy máy ảo Android

export default function App() {
  const [loading, setLoading] = useState(false);

  // Thông tin sản phẩm demo (Hardcode cho đẹp)
  const PRODUCT = {
    name: "Nike Air Jordan 1 Low",
    price: 1000, // Để 10k test cho rẻ
    description: "Thanh toan don hang #123",
    image: "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/b1bcbca4-e853-4df7-b329-5be3c61ee057/air-jordan-1-low-shoes-6Q1tFM.png"
  };

  useEffect(() => {
    // Xử lý khi App được mở lại từ PayOS (Deep link)
    const handleDeepLink = ({ url }) => {
      if (url.includes('payment-success')) {
        Alert.alert('Thanh toán thành công!', 'Cảm ơn bạn đã mua hàng.');
      } else if (url.includes('payment-cancel')) {
        Alert.alert('Thanh toán thất bại', 'Bạn đã hủy giao dịch.');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Kiểm tra nếu App được mở từ một URL (Cold start)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const createPaymentLink = async () => {
    setLoading(true);
    try {
      const orderCode = Date.now().toString(); 
      // Scheme deep link: client://
      const returnUrl = `client://payment-success`; 
      const cancelUrl = `client://payment-cancel`; 

      const response = await fetch(`${BACKEND_URL}/create-payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: PRODUCT.price,
          orderCode: orderCode,
          description: PRODUCT.description,
          returnUrl: returnUrl,
          cancelUrl: cancelUrl,
        }),
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        const supported = await Linking.canOpenURL(data.checkoutUrl);
        if (supported) {
          await Linking.openURL(data.checkoutUrl);
        } else {
          Alert.alert('Lỗi', 'Không thể mở trình duyệt');
        }
      } else {
        Alert.alert('Lỗi', data.error || 'Không tạo được link thanh toán');
      }
    } catch (error) {
      console.error('Lỗi mạng:', error);
      Alert.alert('Lỗi kết nối', 'Vui lòng kiểm tra lại server backend.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
      </View>

      <View style={styles.content}>
        {/* Thẻ sản phẩm */}
        <View style={styles.card}>
          <Image source={{ uri: PRODUCT.image }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{PRODUCT.name}</Text>
            <Text style={styles.productPrice}>{formatCurrency(PRODUCT.price)}</Text>
            <Text style={styles.productDesc}>Size: 42 | Màu: Đen/Đỏ</Text>
          </View>
        </View>

        {/* Tổng cộng */}
        <View style={styles.summaryContainer}>
          <View style={styles.row}>
            <Text style={styles.label}>Tạm tính</Text>
            <Text style={styles.value}>{formatCurrency(PRODUCT.price)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phí vận chuyển</Text>
            <Text style={styles.value}>Miễn phí</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatCurrency(PRODUCT.price)}</Text>
          </View>
        </View>
      </View>

      {/* Nút thanh toán */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payButton, loading && styles.disabledButton]} 
          onPress={createPaymentLink}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Thanh toán qua PayOS</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    marginLeft: 15,
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 12,
    color: '#888',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E53935',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
  },
  payButton: {
    backgroundColor: '#5c4ad6', // Màu tím PayOS (gần giống)
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#5c4ad6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#a095e8',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});