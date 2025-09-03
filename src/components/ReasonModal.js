import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../constants';
import { wp, hp, fontSize, spacing, borderRadius } from '../utils/dimensions';


const ReasonModal = ({ visible, onClose, onSubmit, title,reasonsList }) => {
    const [selectedReason, setSelectedReason] = useState(null);
    const [customReason, setCustomReason] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!selectedReason) {
            setError('Please select a reason.');
            return;
        }

        if (selectedReason === 'Other' && customReason.trim() === '') {
            setError('Please enter your reason.');
            return;
        }

        let finalReason = selectedReason === 'Other' ? customReason : selectedReason;
        onSubmit(finalReason);

        // Reset state
        setSelectedReason(null);
        setCustomReason('');
        setError('');
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modalBox}>
                    <View style={styles.topBar}>
                        <View style={styles.handle} />
                    </View>
                    
                    <Text style={styles.heading}>{title}</Text>
                    
                    <View style={styles.reasonsList}>
                        {reasonsList.map((item, index) => {
                            const isSelected = selectedReason === item;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.reasonOption,
                                        isSelected && styles.reasonOptionSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedReason(item);
                                        setError('');
                                    }}>
                                    <Text style={[
                                        styles.reasonText,
                                        isSelected && styles.reasonTextSelected
                                    ]}>
                                        {item}
                                    </Text>
                                    {isSelected && (
                                        <Icon name="check-circle" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {selectedReason === 'Other' && (
                        <View style={styles.otherSection}>
                            <Text style={styles.otherLabel}>Tell us more:</Text>
                            <TextInput
                                style={styles.otherInput}
                                placeholder="Write your reason here..."
                                placeholderTextColor={COLORS.textSecondary}
                                value={customReason}
                                onChangeText={text => {
                                    setCustomReason(text);
                                    setError('');
                                }}
                                multiline
                                numberOfLines={2}
                            />
                        </View>
                    )}
                    
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.confirmButton, !selectedReason && styles.confirmButtonDisabled]} 
                            onPress={handleSubmit}
                            disabled={!selectedReason}>
                            <Text style={styles.confirmText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { 
        flex: 1, 
        justifyContent: 'flex-end', 
        backgroundColor: 'rgba(0,0,0,0.5)' 
    },
    modalBox: { 
        backgroundColor: COLORS.white, 
        borderTopLeftRadius: wp('5%'),
        borderTopRightRadius: wp('5%'),
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xl,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    topBar: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    handle: {
        width: wp('10%'),
        height: wp('1%'),
        backgroundColor: COLORS.border,
        borderRadius: wp('0.5%'),
    },
    heading: { 
        fontSize: fontSize.xl, 
        fontWeight: 'bold', 
        color: COLORS.text,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    reasonsList: {
        marginBottom: spacing.lg,
    },
    reasonOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    reasonOptionSelected: {
        backgroundColor: COLORS.primary + '08',
    },
    reasonText: { 
        fontSize: fontSize.md, 
        color: COLORS.text,
        fontWeight: '500',
        flex: 1,
    },
    reasonTextSelected: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    otherSection: {
        marginTop: spacing.sm,
        padding: spacing.md,
        backgroundColor: COLORS.surface,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
    },
    otherLabel: {
        fontSize: fontSize.sm,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: wp('2%'),
    },
    otherInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        fontSize: fontSize.md,
        minHeight: hp('6.25%'),
        textAlignVertical: 'top',
        backgroundColor: COLORS.white,
    },
    errorText: { 
        color: COLORS.error, 
        fontSize: fontSize.sm, 
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: wp('3%'),
    },
    cancelButton: {
        flex: 1,
        paddingVertical: spacing.md,
        backgroundColor: COLORS.gray,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    cancelText: {
        color: COLORS.white,
        fontSize: fontSize.md,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: spacing.md,
        backgroundColor: COLORS.primary,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: COLORS.gray,
        opacity: 0.6,
    },
    confirmText: {
        color: COLORS.white,
        fontSize: fontSize.md,
        fontWeight: '600',
    },
});

export default ReasonModal;
