import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Modal, Pressable, Dimensions } from 'react-native';
import { theme } from '../../core/theme';

const { width, height } = Dimensions.get('window');

const HOURS = Array.from({ length: 24 }, (_, i) => ({ id: String(i), label: String(i).padStart(2, '0') }));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ id: String(i), label: String(i).padStart(2, '0') }));

interface TimePickerProps {
  label: string;
  value: string;
  onSelect: (value: string) => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({ label, value, onSelect }) => {
  const parseValue = (val: string) => {
    if (!val) return { hour: '07', minute: '00', hourEnd: '07', minuteEnd: '30', isRange: false };
    if (val.includes(' - ')) {
      const [start, end] = val.split(' - ');
      const [h1, m1] = start.split(':');
      const [h2, m2] = end.split(':');
      return {
        hour: String(h1).padStart(2, '0'),
        minute: String(m1 || '00').padStart(2, '0'),
        hourEnd: String(h2).padStart(2, '0'),
        minuteEnd: String(m2 || '00').padStart(2, '0'),
        isRange: true,
      };
    }
    const [h, m] = val.split(':');
    return {
      hour: String(h).padStart(2, '0'),
      minute: String(m || '00').padStart(2, '0'),
      hourEnd: '07',
      minuteEnd: '30',
      isRange: false,
    };
  };

  const parsed = parseValue(value);
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [hourEnd, setHourEnd] = useState(parsed.hourEnd);
  const [minuteEnd, setMinuteEnd] = useState(parsed.minuteEnd);
  const [isRange, setIsRange] = useState(parsed.isRange);

  useEffect(() => {
    const p = parseValue(value);
    setHour(p.hour);
    setMinute(p.minute);
    setHourEnd(p.hourEnd);
    setMinuteEnd(p.minuteEnd);
    setIsRange(p.isRange);
  }, [value]);

  const formatTime = (h: string, m: string) => {
    const hPadded = String(h).padStart(2, '0');
    const mPadded = String(m).padStart(2, '0');
    return `${hPadded}:${mPadded}`;
  };

  const displayValue = value || (isRange ? `${formatTime(hour, minute)} - ${formatTime(hourEnd, minuteEnd)}` : formatTime(hour, minute));

  const handleConfirm = () => {
    const result = isRange ? `${formatTime(hour, minute)} - ${formatTime(hourEnd, minuteEnd)}` : formatTime(hour, minute);
    onSelect(result);
    setOpen(false);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setOpen(true)}>
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>{displayValue || 'Select time...'}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.timePickerContent}>
              <View style={styles.timePickerHeader}>
                <Text style={styles.modalTitle}>{label}</Text>
                <TouchableOpacity onPress={() => setIsRange(!isRange)}>
                  <Text style={styles.rangeToggle}>{isRange ? 'Range' : 'Single'} {isRange ? '✓' : ''}</Text>
                </TouchableOpacity>
              </View>
              {!isRange ? (
                <View style={styles.timePickerBody}>
                  <ScrollView style={styles.timePickerColumn}>
                    {HOURS.map((h) => {
                      const hPadded = h.id.padStart(2, '0');
                      return (
                        <TouchableOpacity
                          key={h.id}
                          style={[styles.timePickerItem, hour === hPadded && styles.timePickerItemSelected]}
                          onPress={() => setHour(hPadded)}
                        >
                          <Text style={[styles.timePickerItemText, hour === hPadded && styles.timePickerItemTextSelected]}>
                            {h.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <Text style={styles.timePickerSeparator}>:</Text>
                  <ScrollView style={styles.timePickerColumn}>
                    {MINUTES.filter((_, i) => i % 5 === 0).map((m) => {
                      const mPadded = m.id.padStart(2, '0');
                      return (
                        <TouchableOpacity
                          key={m.id}
                          style={[styles.timePickerItem, minute === mPadded && styles.timePickerItemSelected]}
                          onPress={() => setMinute(mPadded)}
                        >
                          <Text style={[styles.timePickerItemText, minute === mPadded && styles.timePickerItemTextSelected]}>
                            {m.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.timePickerBody}>
                  <View style={styles.timeRangeSection}>
                    <Text style={styles.timeRangeLabel}>From</Text>
                    <View style={styles.timePickerRow}>
                      <ScrollView style={styles.timePickerColumn}>
                        {HOURS.map((h) => {
                          const hPadded = h.id.padStart(2, '0');
                          return (
                            <TouchableOpacity
                              key={h.id}
                              style={[styles.timePickerItem, hour === hPadded && styles.timePickerItemSelected]}
                              onPress={() => setHour(hPadded)}
                            >
                              <Text style={[styles.timePickerItemText, hour === hPadded && styles.timePickerItemTextSelected]}>
                                {h.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                      <Text style={styles.timePickerSeparator}>:</Text>
                      <ScrollView style={styles.timePickerColumn}>
                        {MINUTES.filter((_, i) => i % 5 === 0).map((m) => {
                          const mPadded = m.id.padStart(2, '0');
                          return (
                            <TouchableOpacity
                              key={m.id}
                              style={[styles.timePickerItem, minute === mPadded && styles.timePickerItemSelected]}
                              onPress={() => setMinute(mPadded)}
                            >
                              <Text style={[styles.timePickerItemText, minute === mPadded && styles.timePickerItemTextSelected]}>
                                {m.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                  <View style={styles.timeRangeSection}>
                    <Text style={styles.timeRangeLabel}>To</Text>
                    <View style={styles.timePickerRow}>
                      <ScrollView style={styles.timePickerColumn}>
                        {HOURS.map((h) => {
                          const hPadded = h.id.padStart(2, '0');
                          return (
                            <TouchableOpacity
                              key={h.id}
                              style={[styles.timePickerItem, hourEnd === hPadded && styles.timePickerItemSelected]}
                              onPress={() => setHourEnd(hPadded)}
                            >
                              <Text style={[styles.timePickerItemText, hourEnd === hPadded && styles.timePickerItemTextSelected]}>
                                {h.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                      <Text style={styles.timePickerSeparator}>:</Text>
                      <ScrollView style={styles.timePickerColumn}>
                        {MINUTES.filter((_, i) => i % 5 === 0).map((m) => {
                          const mPadded = m.id.padStart(2, '0');
                          return (
                            <TouchableOpacity
                              key={m.id}
                              style={[styles.timePickerItem, minuteEnd === mPadded && styles.timePickerItemSelected]}
                              onPress={() => setMinuteEnd(mPadded)}
                            >
                              <Text style={[styles.timePickerItemText, minuteEnd === mPadded && styles.timePickerItemTextSelected]}>
                                {m.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              )}
              <View style={styles.timePickerActions}>
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setOpen(false)}>
                  <Text style={[styles.btnText, styles.btnGhostText]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={handleConfirm}>
                  <Text style={styles.btnText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    marginBottom: 6,
  },
  dropdown: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  dropdownPlaceholder: {
    color: 'rgba(0,0,0,0.35)',
  },
  dropdownArrow: {
    color: theme.colors.textSecondary,
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  timePickerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: width,
    maxHeight: height * 0.7,
    padding: 20,
    paddingBottom: 40,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  rangeToggle: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  timePickerBody: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timePickerColumn: {
    width: 80,
    maxHeight: 200,
  },
  timePickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  timePickerItemSelected: {
    backgroundColor: `${theme.colors.primary}25`,
  },
  timePickerItemText: {
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  timePickerItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  timePickerSeparator: {
    fontSize: 24,
    marginHorizontal: 8,
    color: theme.colors.textPrimary,
  },
  timePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.background,
  },
  btnGhostText: {
    color: theme.colors.primary,
  },
  timeRangeSection: {
    flex: 1,
    alignItems: 'center',
  },
  timeRangeLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
});

