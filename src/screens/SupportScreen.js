import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { COLORS, STRINGS } from '../constants';
import Icon from 'react-native-vector-icons/MaterialIcons';

const FAQ_DATA = [
  {
    question: 'How do I book a gas cylinder?',
    answer: 'You can book a gas cylinder through the \'Gas Booking\' section of the app. Simply select the cylinder type and add it to your cart, then proceed to checkout.',
  },
  {
    question: 'What payment methods are available?',
    answer: 'Currently, we only support Cash on Delivery (COD). We are working on integrating more payment options soon.',
  },
  {
    question: 'How can I track my order?',
    answer: 'You can track your order status in real-time from the \'Orders\' section. The status will update as your order progresses from Pending to Delivered.',
  },
  {
    question: 'Can I change my delivery address after placing an order?',
    answer: 'Once an order is placed, the delivery address cannot be changed. Please ensure your delivery address is correct before confirming your order.',
  },
  {
    question: 'How do I raise a complaint or refund request?',
    answer: 'You can use the \'Raise Complaint\' or \'Refund Request\' forms available on this Support screen. Fill in the details, and our team will get back to you.',
  },
  {
    question: 'What if my OTP is not received?',
    answer: 'If you do not receive the OTP, please check your network connection or try the \'Resend OTP\' option on the login screen. If the issue persists, please contact our support.',
  },
];

const SupportScreen = () => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [refundText, setRefundText] = useState('');


  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@gasbooking.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+919876543210');
  };

  const handleRaiseComplaint = () => {
    Linking.openURL('mailto:support@gasbooking.com?subject=Complaint');
  };

  const handleSubmitRefund = () => {
    if (!refundText.trim()) {
      Alert.alert('Error', 'Please enter your refund request details.');
      return;
    }
    Alert.alert('Success', 'Your refund request has been submitted. We will review it and process accordingly.');
    setRefundText('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{STRINGS.support}</Text>
      </View>

      {/* Raise Complaint Button */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{STRINGS.raiseComplaint}</Text>
        <Text style={styles.sectionDescription}>
          Click below to send us an email with your complaint details.
        </Text>
        <TouchableOpacity style={styles.complaintButton} onPress={handleRaiseComplaint}>
          <Icon name="email" size={20} color={COLORS.white} />
          <Text style={styles.complaintButtonText}>Send Email Complaint</Text>
        </TouchableOpacity>
      </View>

      {/* Refund Request Form */}
      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>{STRINGS.refundRequest}</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe your refund request here..."
          multiline
          numberOfLines={4}
          value={refundText}
          onChangeText={setRefundText}
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRefund}>
          <Text style={styles.submitButtonText}>{STRINGS.submit}</Text>
        </TouchableOpacity>
      </View> */}

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{STRINGS.faq}</Text>
        {FAQ_DATA.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestionContainer}
              onPress={() => toggleFAQ(index)}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqToggle}>
                {expandedFAQ === index ? '−' : '+'}
              </Text>
            </TouchableOpacity>
            {expandedFAQ === index && (
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Contact Us */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{STRINGS.contactUs}</Text>
        <Text style={styles.contactText}>
          For further assistance, please contact us at:
        </Text>
        
        <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
          <Icon name="email" size={20} color={COLORS.primary} />
          <Text style={styles.contactLink}>support@gasbooking.com</Text>
          <Icon name="launch" size={16} color={COLORS.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.contactItem} onPress={handlePhonePress}>
          <Icon name="phone" size={20} color={COLORS.primary} />
          <Text style={styles.contactLink}>+91 98765 43210</Text>
          <Icon name="launch" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 23,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    marginTop: 15,
    marginHorizontal: 15,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: COLORS.white,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  complaintButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  complaintButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  faqItem: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  faqQuestionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
    paddingRight: 10,
  },
  faqToggle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 5,
    lineHeight: 20,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactLink: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 5,
  },
});

export default SupportScreen;

