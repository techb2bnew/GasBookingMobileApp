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
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 30,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    topBar: {
        alignItems: 'center',
        marginBottom: 20,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
    },
    heading: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: COLORS.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    reasonsList: {
        marginBottom: 20,
    },
    reasonOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    reasonOptionSelected: {
        backgroundColor: COLORS.primary + '08',
    },
    reasonText: { 
        fontSize: 16, 
        color: COLORS.text,
        fontWeight: '500',
        flex: 1,
    },
    reasonTextSelected: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    otherSection: {
        marginTop: 10,
        padding: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        marginBottom: 20,
    },
    otherLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    otherInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 50,
        textAlignVertical: 'top',
        backgroundColor: COLORS.white,
    },
    errorText: { 
        color: COLORS.error, 
        fontSize: 14, 
        marginBottom: 20,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: COLORS.gray,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: COLORS.gray,
        opacity: 0.6,
    },
    confirmText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ReasonModal;
