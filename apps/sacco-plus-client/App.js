import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import Animated, { FadeIn } from 'react-native-reanimated';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeScreen() {
  const currentDate = dayjs().format('MMMM D, YYYY');
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.gradient}
      >
        <Animated.View entering={FadeIn} style={styles.content}>
          <Ionicons name="checkmark-circle" size={64} color="white" />
          <Text style={styles.title}>SACCO Plus Client</Text>
          <Text style={styles.subtitle}>All dependencies installed! ✓</Text>
          <Text style={styles.date}>{currentDate}</Text>
          
          <BlurView intensity={50} tint="light" style={styles.blurContainer}>
            <Text style={styles.infoText}>
              ✓ React Navigation (Native Stack & Bottom Tabs){'\n'}
              ✓ React Native Screens{'\n'}
              ✓ Safe Area Context{'\n'}
              ✓ Gesture Handler{'\n'}
              ✓ Reanimated{'\n'}
              ✓ Linear Gradient{'\n'}
              ✓ Blur{'\n'}
              ✓ Vector Icons{'\n'}
              ✓ Dayjs
            </Text>
          </BlurView>
        </Animated.View>
      </LinearGradient>
      <StatusBar style="light" />
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Ionicons name="settings" size={48} color="#3b5998" />
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b5998',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Main" 
          component={TabNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginTop: 10,
  },
  date: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  blurContainer: {
    marginTop: 30,
    padding: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});
