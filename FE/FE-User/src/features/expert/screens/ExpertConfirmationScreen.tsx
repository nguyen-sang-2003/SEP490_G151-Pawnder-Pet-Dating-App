import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getUserExpertConfirmations, ExpertConfirmation } from "../api/expertConfirmationApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createOrGetExpertChat } from "../api/expertChatApi";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";

type Props = NativeStackScreenProps<RootStackParamList, "ExpertConfirmation">;

const ExpertConfirmationScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<ExpertConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'answered' | 'pending'>('all');
  const [creatingChat, setCreatingChat] = useState(false);
  const { visible: alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();

  // TODO: Implement the rest of the screen
  return null;
}