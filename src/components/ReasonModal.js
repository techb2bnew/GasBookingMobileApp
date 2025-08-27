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
                    <Text style={styles.heading}>{title}</Text>


                    <FlatList
                        data={reasonsList}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => {
                            const isSelected = selectedReason === item;
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.reasonItem,
                                        isSelected && { backgroundColor: COLORS.primary },
                                    ]}
                                    onPress={() => {
                                        setSelectedReason(item);
                                        setError('');
                                    }}>
                                    <Text
                                        style={[
                                            styles.reasonText,
                                            isSelected && { color: COLORS.white, fontWeight: '600' },
                                        ]}>
                                        {item}
                                    </Text>
                                    {isSelected && (
                                        <Icon
                                            name="check-circle"
                                            size={20}
                                            color={COLORS.white}
                                            style={{ marginLeft: 8 }}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />

                    {selectedReason === 'Other' && (
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your reason"
                            placeholderTextColor={COLORS.gray}
                            value={customReason}
                            onChangeText={text => {
                                setCustomReason(text);
                                setError('');
                            }}
                            multiline
                        />
                    )}
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <View style={styles.footerBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                            <Text style={styles.submitText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalBox: { width: '90%', backgroundColor: COLORS.white, padding: 20, borderRadius: 10 },
    heading: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    errorText: { color: COLORS.error, fontSize: 14, marginBottom: 10 },
    reasonItem: {
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.gray,
        borderRadius: 8,
        marginVertical: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reasonText: { fontSize: 16, color: COLORS.black },
    input: {
        borderWidth: 1,
        borderColor: COLORS.gray,
        borderRadius: 8,
        padding: 14,
        marginTop: 12,
        fontSize: 16,
        minHeight: 50,
        textAlignVertical: 'top',
    },
    footerBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.error, borderRadius: 8 },
    cancelText: { color: COLORS.white, fontSize: 16 },
    submitBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.gradientEnd, borderRadius: 8 },
    submitText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});

export default ReasonModal;
