import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { colors, shadows } from '../../../theme';
import OptimizedImage from '../../../components/OptimizedImage';

const { width, height } = Dimensions.get('window');

interface MatchModalProps {
  visible: boolean;
  otherUserName: string;
  otherUserId: number;
  matchId: number;
  petName?: string;
  petPhotoUrl?: string;
  onView: () => void;
  onStartChat: () => void;
  onClose: () => void;
}

const MatchModal: React.FC<MatchModalProps> = ({
  visible,
  otherUserName,
  otherUserId,
  matchId,
  petName,
  petPhotoUrl,
  onView,
  onStartChat,
  onClose,
}) => {
  const { t } = useTranslation();
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.matchModal}>
        <LinearGradient
          colors={["rgba(255,110,167,0.97)", "rgba(255,155,192,0.97)"]}
          style={styles.matchGradient}
        >
          <View style={styles.matchIconContainer}>
            <Icon name="heart" size={80} color={colors.white} />
          </View>
          
          <Text style={styles.matchTitle}>{t('match.title')}</Text>
          
          <Text style={styles.matchText}>
            {t('match.subtitle', { name: otherUserName })}
          </Text>

          {petPhotoUrl && petPhotoUrl !== "null" && petPhotoUrl !== "" && (
            <View style={styles.matchPetContainer}>
              <OptimizedImage 
                source={{ uri: petPhotoUrl }} 
                style={styles.matchPetImage}
                resizeMode="cover"
                imageSize="card"
              />
              {petName && (
                <Text style={styles.matchPetName}>{petName}</Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.sendMessageButton}
            onPress={onStartChat}
            activeOpacity={0.9}
          >
            <Icon name="chatbubble" size={20} color={colors.primary} />
            <Text style={styles.sendMessageText}>{t('match.sendMessage')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.keepSwipingButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.keepSwipingText}>{t('match.keepSwiping')}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  matchModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  matchGradient: {
    width: width * 0.85,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  matchIconContainer: {
    marginBottom: 20,
  },
  matchTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 12,
    textAlign: "center",
  },
  matchText: {
    fontSize: 16,
    color: colors.white,
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.95,
  },
  sendMessageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginBottom: 12,
    width: "100%",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendMessageText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  keepSwipingButton: {
    paddingVertical: 12,
  },
  keepSwipingText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.9,
  },
  matchPetContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
    gap: 12,
  },
  matchPetImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    borderColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  matchPetName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },
});

export default MatchModal;

