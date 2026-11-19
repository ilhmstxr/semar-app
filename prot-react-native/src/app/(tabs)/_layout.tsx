import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Home, Pencil, Recycle, FileText } from 'lucide-react-native';
import { SEMAR_COLORS } from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: SEMAR_COLORS.primary,
        tabBarInactiveTintColor: SEMAR_COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: SEMAR_COLORS.white,
          borderTopColor: SEMAR_COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="status"
        options={{
          title: 'Tong',
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="catat"
        options={{
          title: 'Catat',
          tabBarIcon: ({ color }) => <Pencil size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="olah"
        options={{
          title: 'Olah',
          tabBarIcon: ({ color }) => <Recycle size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="kas"
        options={{
          title: 'Kas',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '800',
                  color: color,
                  letterSpacing: -0.5,
                }}
              >
                Rp
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="dampak"
        options={{
          title: 'Dampak',
          tabBarIcon: ({ color }) => <FileText size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
