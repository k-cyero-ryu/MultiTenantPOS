/**
 * COMPLETE MIGRATION INSTRUCTIONS: Multi-Tenant Web Application to Expo React Native
 * 
 * This file contains step-by-step instructions to recreate the full multi-tenant
 * web application as an Expo React Native project with all features and functionalities.
 * 
 * Original Application Features:
 * - Multi-tenant architecture with Main Head Company (MHC) and subsidiaries
 * - Role-based access control (MHC Admin, Subsidiary Admin, Staff)
 * - Inventory management with CRUD operations
 * - Sales tracking and analytics
 * - Comprehensive reporting system with PDF/CSV export
 * - Multi-language support (English, Spanish, French, Portuguese)
 * - Interactive onboarding tour with tooltips
 * - Database flexibility (PostgreSQL/MySQL)
 * - User management system
 * - Activity logging
 * - Professional dashboard with charts and analytics
 */

const migrationInstructions = {
  // PHASE 1: PROJECT SETUP AND DEPENDENCIES
  phase1_setup: {
    step1: "Initialize Expo project with TypeScript template",
    commands: [
      "npx create-expo-app MultiTenantApp --template typescript",
      "cd MultiTenantApp"
    ],
    
    step2: "Install core navigation dependencies",
    dependencies_navigation: [
      "@react-navigation/native",
      "@react-navigation/stack",
      "@react-navigation/bottom-tabs",
      "@react-navigation/drawer",
      "react-native-screens",
      "react-native-safe-area-context",
      "react-native-gesture-handler",
      "react-native-reanimated"
    ],
    
    step3: "Install UI and styling libraries",
    dependencies_ui: [
      "react-native-vector-icons",
      "@expo/vector-icons",
      "react-native-svg",
      "react-native-svg-transformer",
      "react-native-paper", // Material Design components
      "react-native-elements", // Additional UI components
      "react-native-super-grid", // Grid layouts
      "react-native-modal",
      "react-native-animatable"
    ],
    
    step4: "Install data management and forms",
    dependencies_data: [
      "@tanstack/react-query",
      "react-hook-form",
      "@hookform/resolvers",
      "zod",
      "zustand", // State management
      "async-storage", // Local storage
      "@react-native-async-storage/async-storage"
    ],
    
    step5: "Install internationalization",
    dependencies_i18n: [
      "react-i18next",
      "i18next",
      "expo-localization"
    ],
    
    step6: "Install charts and analytics",
    dependencies_charts: [
      "react-native-chart-kit",
      "react-native-svg", // Required for charts
      "victory-native" // Alternative charting library
    ],
    
    step7: "Install file handling and reports",
    dependencies_files: [
      "expo-file-system",
      "expo-sharing",
      "expo-print", // PDF generation
      "expo-document-picker",
      "react-native-fs"
    ],
    
    step8: "Install authentication and security",
    dependencies_auth: [
      "expo-secure-store", // Secure token storage
      "expo-crypto",
      "expo-auth-session"
    ],
    
    step9: "Install image handling",
    dependencies_images: [
      "expo-image-picker",
      "expo-image-manipulator",
      "react-native-fast-image"
    ],
    
    step10: "Install additional utilities",
    dependencies_utils: [
      "date-fns",
      "lodash",
      "react-native-toast-message",
      "react-native-loading-spinner-overlay",
      "expo-constants",
      "expo-device"
    ]
  },

  // PHASE 2: PROJECT STRUCTURE SETUP
  phase2_structure: {
    step1: "Create main directory structure",
    directories: [
      "src/",
      "src/components/",
      "src/components/ui/",
      "src/components/forms/",
      "src/components/charts/",
      "src/screens/",
      "src/screens/auth/",
      "src/screens/mhc/",
      "src/screens/subsidiary/",
      "src/navigation/",
      "src/services/",
      "src/hooks/",
      "src/utils/",
      "src/types/",
      "src/constants/",
      "src/locales/",
      "src/locales/en/",
      "src/locales/es/",
      "src/locales/fr/",
      "src/locales/pt/",
      "src/stores/",
      "src/theme/"
    ],
    
    step2: "Setup TypeScript configuration",
    tsconfig_additions: {
      "compilerOptions": {
        "baseUrl": "./",
        "paths": {
          "@/*": ["src/*"],
          "@/components/*": ["src/components/*"],
          "@/screens/*": ["src/screens/*"],
          "@/services/*": ["src/services/*"],
          "@/hooks/*": ["src/hooks/*"],
          "@/utils/*": ["src/utils/*"],
          "@/types/*": ["src/types/*"],
          "@/constants/*": ["src/constants/*"],
          "@/theme/*": ["src/theme/*"]
        }
      }
    }
  },

  // PHASE 3: CORE TYPES AND SCHEMAS
  phase3_types: {
    step1: "Create shared types (src/types/index.ts)",
    types_definition: `
      // User roles and permissions
      export type UserRole = 'mhc_admin' | 'subsidiary_admin' | 'staff';
      
      export interface User {
        id: number;
        username: string;
        role: UserRole;
        subsidiaryId?: number;
        createdAt: string;
        updatedAt: string;
      }
      
      export interface Subsidiary {
        id: number;
        name: string;
        taxId: string;
        address?: string;
        city?: string;
        country?: string;
        email?: string;
        phoneNumber?: string;
        logo?: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }
      
      export interface InventoryItem {
        id: number;
        subsidiaryId: number;
        name: string;
        description?: string;
        category: string;
        sku: string;
        costPrice: number;
        salePrice: number;
        quantity: number;
        createdAt: string;
        updatedAt: string;
      }
      
      export interface Sale {
        id: number;
        subsidiaryId: number;
        userId: number;
        itemId: number;
        quantity: number;
        salePrice: number;
        total: number;
        date: string;
        createdAt: string;
      }
      
      export interface ActivityLog {
        id: number;
        userId: number;
        subsidiaryId?: number;
        action: string;
        resource: string;
        details?: string;
        timestamp: string;
      }
      
      // Navigation types
      export type RootStackParamList = {
        Auth: undefined;
        MHCTabs: undefined;
        SubsidiaryTabs: undefined;
      };
      
      export type MHCTabParamList = {
        Dashboard: undefined;
        Subsidiaries: undefined;
        Users: undefined;
        Reports: undefined;
        Settings: undefined;
      };
      
      export type SubsidiaryTabParamList = {
        Dashboard: undefined;
        Inventory: undefined;
        Sales: undefined;
        Users: undefined;
      };
    `,
    
    step2: "Create validation schemas using Zod (src/utils/validation.ts)",
    validation_schemas: `
      import { z } from 'zod';
      
      export const loginSchema = z.object({
        username: z.string().min(1, 'Username is required'),
        password: z.string().min(1, 'Password is required'),
      });
      
      export const userSchema = z.object({
        username: z.string().min(3, 'Username must be at least 3 characters'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        role: z.enum(['mhc_admin', 'subsidiary_admin', 'staff']),
        subsidiaryId: z.number().optional(),
      });
      
      export const subsidiarySchema = z.object({
        name: z.string().min(1, 'Company name is required'),
        taxId: z.string().min(1, 'Tax ID is required'),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        email: z.string().email('Invalid email').optional().or(z.literal('')),
        phoneNumber: z.string().optional(),
      });
      
      export const inventorySchema = z.object({
        name: z.string().min(1, 'Product name is required'),
        description: z.string().optional(),
        category: z.string().min(1, 'Category is required'),
        sku: z.string().min(1, 'SKU is required'),
        costPrice: z.number().positive('Cost price must be positive'),
        salePrice: z.number().positive('Sale price must be positive'),
        quantity: z.number().min(0, 'Quantity cannot be negative'),
      });
      
      export const saleSchema = z.object({
        itemId: z.number().positive('Please select an item'),
        quantity: z.number().positive('Quantity must be positive'),
        salePrice: z.number().positive('Sale price must be positive'),
      });
    `
  },

  // PHASE 4: THEME AND STYLING
  phase4_theme: {
    step1: "Create theme system (src/theme/index.ts)",
    theme_definition: `
      export const colors = {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          700: '#a16207',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          700: '#b91c1c',
        },
      };
      
      export const spacing = {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
      };
      
      export const typography = {
        fontSize: {
          xs: 12,
          sm: 14,
          base: 16,
          lg: 18,
          xl: 20,
          '2xl': 24,
          '3xl': 30,
          '4xl': 36,
        },
        fontWeight: {
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700',
        },
      };
      
      export const borderRadius = {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        full: 9999,
      };
    `,
    
    step2: "Create common styles (src/theme/styles.ts)",
    common_styles: `
      import { StyleSheet } from 'react-native';
      import { colors, spacing, typography, borderRadius } from './index';
      
      export const commonStyles = StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.gray[50],
        },
        card: {
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginVertical: spacing.sm,
          shadowColor: colors.gray[900],
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        button: {
          backgroundColor: colors.primary[500],
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: borderRadius.md,
          alignItems: 'center',
        },
        buttonText: {
          color: 'white',
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.semibold,
        },
        input: {
          borderWidth: 1,
          borderColor: colors.gray[300],
          borderRadius: borderRadius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          fontSize: typography.fontSize.base,
          backgroundColor: 'white',
        },
        inputFocus: {
          borderColor: colors.primary[500],
        },
        inputError: {
          borderColor: colors.error[500],
        },
        errorText: {
          color: colors.error[500],
          fontSize: typography.fontSize.sm,
          marginTop: spacing.xs,
        },
        title: {
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.gray[900],
          marginBottom: spacing.md,
        },
        subtitle: {
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.gray[700],
          marginBottom: spacing.sm,
        },
        text: {
          fontSize: typography.fontSize.base,
          color: colors.gray[700],
        },
        textCenter: {
          textAlign: 'center',
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        spaceBetween: {
          justifyContent: 'space-between',
        },
        center: {
          justifyContent: 'center',
          alignItems: 'center',
        },
      });
    `
  },

  // PHASE 5: STATE MANAGEMENT
  phase5_state: {
    step1: "Create auth store (src/stores/authStore.ts)",
    auth_store: `
      import { create } from 'zustand';
      import AsyncStorage from '@react-native-async-storage/async-storage';
      import { User } from '@/types';
      
      interface AuthState {
        user: User | null;
        token: string | null;
        isLoading: boolean;
        isAuthenticated: boolean;
        login: (credentials: { username: string; password: string }) => Promise<void>;
        logout: () => Promise<void>;
        loadStoredAuth: () => Promise<void>;
      }
      
      export const useAuthStore = create<AuthState>((set, get) => ({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        
        login: async (credentials) => {
          try {
            set({ isLoading: true });
            
            // API call to login endpoint
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(credentials),
            });
            
            if (!response.ok) throw new Error('Login failed');
            
            const data = await response.json();
            
            // Store token and user data
            await AsyncStorage.setItem('auth_token', data.token);
            await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
            
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },
        
        logout: async () => {
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_data');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        },
        
        loadStoredAuth: async () => {
          try {
            const token = await AsyncStorage.getItem('auth_token');
            const userData = await AsyncStorage.getItem('user_data');
            
            if (token && userData) {
              set({
                token,
                user: JSON.parse(userData),
                isAuthenticated: true,
              });
            }
          } catch (error) {
            console.error('Failed to load stored auth:', error);
          }
        },
      }));
    `,
    
    step2: "Create app store for global state (src/stores/appStore.ts)",
    app_store: `
      import { create } from 'zustand';
      
      interface AppState {
        language: string;
        theme: 'light' | 'dark';
        selectedSubsidiary: number | null;
        setLanguage: (language: string) => void;
        setTheme: (theme: 'light' | 'dark') => void;
        setSelectedSubsidiary: (id: number | null) => void;
      }
      
      export const useAppStore = create<AppState>((set) => ({
        language: 'en',
        theme: 'light',
        selectedSubsidiary: null,
        setLanguage: (language) => set({ language }),
        setTheme: (theme) => set({ theme }),
        setSelectedSubsidiary: (selectedSubsidiary) => set({ selectedSubsidiary }),
      }));
    `
  },

  // PHASE 6: API SERVICES
  phase6_services: {
    step1: "Create API client (src/services/api.ts)",
    api_client: `
      import AsyncStorage from '@react-native-async-storage/async-storage';
      
      const API_BASE_URL = 'https://your-api-url.com/api'; // Replace with your API URL
      
      class ApiClient {
        private baseURL: string;
        
        constructor(baseURL: string) {
          this.baseURL = baseURL;
        }
        
        private async getAuthHeaders(): Promise<Record<string, string>> {
          const token = await AsyncStorage.getItem('auth_token');
          return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: \`Bearer \${token}\` }),
          };
        }
        
        async request<T>(
          endpoint: string,
          options: RequestInit = {}
        ): Promise<T> {
          const url = \`\${this.baseURL}\${endpoint}\`;
          const headers = await this.getAuthHeaders();
          
          const response = await fetch(url, {
            ...options,
            headers: {
              ...headers,
              ...options.headers,
            },
          });
          
          if (!response.ok) {
            throw new Error(\`API Error: \${response.status}\`);
          }
          
          return response.json();
        }
        
        async get<T>(endpoint: string): Promise<T> {
          return this.request<T>(endpoint, { method: 'GET' });
        }
        
        async post<T>(endpoint: string, data: any): Promise<T> {
          return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
          });
        }
        
        async put<T>(endpoint: string, data: any): Promise<T> {
          return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
          });
        }
        
        async delete<T>(endpoint: string): Promise<T> {
          return this.request<T>(endpoint, { method: 'DELETE' });
        }
      }
      
      export const apiClient = new ApiClient(API_BASE_URL);
    `,
    
    step2: "Create specific service modules",
    services_modules: {
      "src/services/authService.ts": `
        import { apiClient } from './api';
        import { User } from '@/types';
        
        export const authService = {
          login: (credentials: { username: string; password: string }) =>
            apiClient.post<{ user: User; token: string }>('/auth/login', credentials),
          
          register: (userData: any) =>
            apiClient.post<{ user: User; token: string }>('/auth/register', userData),
          
          getCurrentUser: () =>
            apiClient.get<User>('/auth/me'),
        };
      `,
      
      "src/services/subsidiaryService.ts": `
        import { apiClient } from './api';
        import { Subsidiary } from '@/types';
        
        export const subsidiaryService = {
          getAll: () => apiClient.get<Subsidiary[]>('/subsidiaries'),
          getById: (id: number) => apiClient.get<Subsidiary>(\`/subsidiaries/\${id}\`),
          create: (data: Partial<Subsidiary>) => apiClient.post<Subsidiary>('/subsidiaries', data),
          update: (id: number, data: Partial<Subsidiary>) => 
            apiClient.put<Subsidiary>(\`/subsidiaries/\${id}\`, data),
          delete: (id: number) => apiClient.delete(\`/subsidiaries/\${id}\`),
        };
      `,
      
      "src/services/inventoryService.ts": `
        import { apiClient } from './api';
        import { InventoryItem } from '@/types';
        
        export const inventoryService = {
          getAll: (subsidiaryId?: number) => {
            const endpoint = subsidiaryId 
              ? \`/subsidiaries/\${subsidiaryId}/inventory\` 
              : '/inventory';
            return apiClient.get<InventoryItem[]>(endpoint);
          },
          getById: (id: number) => apiClient.get<InventoryItem>(\`/inventory/\${id}\`),
          create: (data: Partial<InventoryItem>) => apiClient.post<InventoryItem>('/inventory', data),
          update: (id: number, data: Partial<InventoryItem>) => 
            apiClient.put<InventoryItem>(\`/inventory/\${id}\`, data),
          delete: (id: number) => apiClient.delete(\`/inventory/\${id}\`),
        };
      `,
      
      "src/services/salesService.ts": `
        import { apiClient } from './api';
        import { Sale } from '@/types';
        
        export const salesService = {
          getAll: (subsidiaryId?: number) => {
            const endpoint = subsidiaryId 
              ? \`/subsidiaries/\${subsidiaryId}/sales\` 
              : '/sales';
            return apiClient.get<Sale[]>(endpoint);
          },
          create: (data: Partial<Sale>) => apiClient.post<Sale>('/sales', data),
          getAnalytics: (subsidiaryId?: number, timeRange?: string) => {
            let endpoint = '/sales/analytics';
            const params = new URLSearchParams();
            if (subsidiaryId) params.append('subsidiaryId', subsidiaryId.toString());
            if (timeRange) params.append('timeRange', timeRange);
            if (params.toString()) endpoint += \`?\${params.toString()}\`;
            return apiClient.get(endpoint);
          },
        };
      `,
      
      "src/services/reportsService.ts": `
        import { apiClient } from './api';
        
        export const reportsService = {
          getSalesReport: (params: {
            subsidiaryId?: number;
            timeRange?: string;
            startDate?: string;
            endDate?: string;
            format?: 'json' | 'csv';
          }) => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
              if (value) searchParams.append(key, value.toString());
            });
            return apiClient.get(\`/reports/sales?\${searchParams.toString()}\`);
          },
          
          getInventoryReport: (params: any) => {
            const searchParams = new URLSearchParams(params);
            return apiClient.get(\`/reports/inventory?\${searchParams.toString()}\`);
          },
          
          getActivityReport: (params: any) => {
            const searchParams = new URLSearchParams(params);
            return apiClient.get(\`/reports/activity?\${searchParams.toString()}\`);
          },
        };
      `
    }
  },

  // PHASE 7: INTERNATIONALIZATION
  phase7_i18n: {
    step1: "Setup i18next configuration (src/locales/i18n.ts)",
    i18n_config: `
      import i18n from 'i18next';
      import { initReactI18next } from 'react-i18next';
      import * as Localization from 'expo-localization';
      
      import en from './en/translation.json';
      import es from './es/translation.json';
      import fr from './fr/translation.json';
      import pt from './pt/translation.json';
      
      const resources = {
        en: { translation: en },
        es: { translation: es },
        fr: { translation: fr },
        pt: { translation: pt },
      };
      
      i18n
        .use(initReactI18next)
        .init({
          resources,
          lng: Localization.locale.split('-')[0] || 'en',
          fallbackLng: 'en',
          interpolation: {
            escapeValue: false,
          },
        });
      
      export default i18n;
    `,
    
    step2: "Create translation files for each language",
    translation_structure: {
      note: "Copy all translation JSON files from the original web app:",
      files: [
        "src/locales/en/translation.json",
        "src/locales/es/translation.json", 
        "src/locales/fr/translation.json",
        "src/locales/pt/translation.json"
      ],
      content: "Use the exact same translation structure from the original application"
    }
  },

  // PHASE 8: NAVIGATION SYSTEM
  phase8_navigation: {
    step1: "Create main navigation (src/navigation/index.tsx)",
    main_navigation: `
      import React from 'react';
      import { NavigationContainer } from '@react-navigation/native';
      import { createStackNavigator } from '@react-navigation/stack';
      import { useAuthStore } from '@/stores/authStore';
      import AuthNavigator from './AuthNavigator';
      import MHCNavigator from './MHCNavigator';
      import SubsidiaryNavigator from './SubsidiaryNavigator';
      import { RootStackParamList } from '@/types';
      
      const Stack = createStackNavigator<RootStackParamList>();
      
      export default function RootNavigator() {
        const { isAuthenticated, user } = useAuthStore();
        
        if (!isAuthenticated) {
          return (
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Auth" component={AuthNavigator} />
              </Stack.Navigator>
            </NavigationContainer>
          );
        }
        
        return (
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {user?.role === 'mhc_admin' ? (
                <Stack.Screen name="MHCTabs" component={MHCNavigator} />
              ) : (
                <Stack.Screen name="SubsidiaryTabs" component={SubsidiaryNavigator} />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        );
      }
    `,
    
    step2: "Create specific navigators for different user roles",
    role_navigators: {
      "src/navigation/MHCNavigator.tsx": `
        import React from 'react';
        import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
        import { Ionicons } from '@expo/vector-icons';
        import { colors } from '@/theme';
        import { MHCTabParamList } from '@/types';
        
        // Import screens
        import MHCDashboardScreen from '@/screens/mhc/DashboardScreen';
        import SubsidiariesScreen from '@/screens/mhc/SubsidiariesScreen';
        import UsersScreen from '@/screens/mhc/UsersScreen';
        import ReportsScreen from '@/screens/mhc/ReportsScreen';
        import SettingsScreen from '@/screens/mhc/SettingsScreen';
        
        const Tab = createBottomTabNavigator<MHCTabParamList>();
        
        export default function MHCNavigator() {
          return (
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName: keyof typeof Ionicons.glyphMap;
                  
                  switch (route.name) {
                    case 'Dashboard':
                      iconName = focused ? 'home' : 'home-outline';
                      break;
                    case 'Subsidiaries':
                      iconName = focused ? 'business' : 'business-outline';
                      break;
                    case 'Users':
                      iconName = focused ? 'people' : 'people-outline';
                      break;
                    case 'Reports':
                      iconName = focused ? 'document-text' : 'document-text-outline';
                      break;
                    case 'Settings':
                      iconName = focused ? 'settings' : 'settings-outline';
                      break;
                    default:
                      iconName = 'circle';
                  }
                  
                  return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.primary[500],
                tabBarInactiveTintColor: colors.gray[400],
                tabBarStyle: {
                  backgroundColor: 'white',
                  borderTopColor: colors.gray[200],
                },
              })}
            >
              <Tab.Screen name="Dashboard" component={MHCDashboardScreen} />
              <Tab.Screen name="Subsidiaries" component={SubsidiariesScreen} />
              <Tab.Screen name="Users" component={UsersScreen} />
              <Tab.Screen name="Reports" component={ReportsScreen} />
              <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>
          );
        }
      `,
      
      "src/navigation/SubsidiaryNavigator.tsx": `
        import React from 'react';
        import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
        import { Ionicons } from '@expo/vector-icons';
        import { colors } from '@/theme';
        import { SubsidiaryTabParamList } from '@/types';
        
        // Import screens
        import SubsidiaryDashboardScreen from '@/screens/subsidiary/DashboardScreen';
        import InventoryScreen from '@/screens/subsidiary/InventoryScreen';
        import SalesScreen from '@/screens/subsidiary/SalesScreen';
        import SubsidiaryUsersScreen from '@/screens/subsidiary/UsersScreen';
        
        const Tab = createBottomTabNavigator<SubsidiaryTabParamList>();
        
        export default function SubsidiaryNavigator() {
          return (
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName: keyof typeof Ionicons.glyphMap;
                  
                  switch (route.name) {
                    case 'Dashboard':
                      iconName = focused ? 'home' : 'home-outline';
                      break;
                    case 'Inventory':
                      iconName = focused ? 'cube' : 'cube-outline';
                      break;
                    case 'Sales':
                      iconName = focused ? 'card' : 'card-outline';
                      break;
                    case 'Users':
                      iconName = focused ? 'people' : 'people-outline';
                      break;
                    default:
                      iconName = 'circle';
                  }
                  
                  return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.primary[500],
                tabBarInactiveTintColor: colors.gray[400],
              })}
            >
              <Tab.Screen name="Dashboard" component={SubsidiaryDashboardScreen} />
              <Tab.Screen name="Inventory" component={InventoryScreen} />
              <Tab.Screen name="Sales" component={SalesScreen} />
              <Tab.Screen name="Users" component={SubsidiaryUsersScreen} />
            </Tab.Navigator>
          );
        }
      `
    }
  },

  // PHASE 9: REUSABLE COMPONENTS
  phase9_components: {
    step1: "Create UI components library",
    ui_components: {
      "src/components/ui/Button.tsx": `
        import React from 'react';
        import {
          TouchableOpacity,
          Text,
          ActivityIndicator,
          TouchableOpacityProps,
          ViewStyle,
          TextStyle,
        } from 'react-native';
        import { commonStyles } from '@/theme/styles';
        import { colors } from '@/theme';
        
        interface ButtonProps extends TouchableOpacityProps {
          title: string;
          variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
          size?: 'sm' | 'md' | 'lg';
          loading?: boolean;
          fullWidth?: boolean;
          buttonStyle?: ViewStyle;
          textStyle?: TextStyle;
        }
        
        export default function Button({
          title,
          variant = 'primary',
          size = 'md',
          loading = false,
          fullWidth = false,
          buttonStyle,
          textStyle,
          disabled,
          ...props
        }: ButtonProps) {
          const getButtonStyle = (): ViewStyle => {
            const baseStyle = { ...commonStyles.button };
            
            if (fullWidth) baseStyle.width = '100%';
            
            switch (variant) {
              case 'secondary':
                return { ...baseStyle, backgroundColor: colors.gray[500] };
              case 'outline':
                return {
                  ...baseStyle,
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: colors.primary[500],
                };
              case 'ghost':
                return { ...baseStyle, backgroundColor: 'transparent' };
              default:
                return baseStyle;
            }
          };
          
          const getTextStyle = (): TextStyle => {
            const baseStyle = { ...commonStyles.buttonText };
            
            if (variant === 'outline' || variant === 'ghost') {
              baseStyle.color = colors.primary[500];
            }
            
            return baseStyle;
          };
          
          return (
            <TouchableOpacity
              style={[
                getButtonStyle(),
                buttonStyle,
                (disabled || loading) && { opacity: 0.6 },
              ]}
              disabled={disabled || loading}
              {...props}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={[getTextStyle(), textStyle]}>{title}</Text>
              )}
            </TouchableOpacity>
          );
        }
      `,
      
      "src/components/ui/Input.tsx": `
        import React, { forwardRef } from 'react';
        import {
          TextInput,
          View,
          Text,
          TextInputProps,
          ViewStyle,
        } from 'react-native';
        import { commonStyles } from '@/theme/styles';
        import { colors } from '@/theme';
        
        interface InputProps extends TextInputProps {
          label?: string;
          error?: string;
          containerStyle?: ViewStyle;
          required?: boolean;
        }
        
        const Input = forwardRef<TextInput, InputProps>(({
          label,
          error,
          containerStyle,
          required,
          style,
          ...props
        }, ref) => {
          return (
            <View style={containerStyle}>
              {label && (
                <Text style={[commonStyles.text, { marginBottom: 4 }]}>
                  {label}
                  {required && <Text style={{ color: colors.error[500] }}> *</Text>}
                </Text>
              )}
              <TextInput
                ref={ref}
                style={[
                  commonStyles.input,
                  error && commonStyles.inputError,
                  style,
                ]}
                placeholderTextColor={colors.gray[400]}
                {...props}
              />
              {error && (
                <Text style={commonStyles.errorText}>{error}</Text>
              )}
            </View>
          );
        });
        
        Input.displayName = 'Input';
        
        export default Input;
      `,
      
      "src/components/ui/Card.tsx": `
        import React from 'react';
        import { View, ViewProps } from 'react-native';
        import { commonStyles } from '@/theme/styles';
        
        interface CardProps extends ViewProps {
          children: React.ReactNode;
        }
        
        export default function Card({ children, style, ...props }: CardProps) {
          return (
            <View style={[commonStyles.card, style]} {...props}>
              {children}
            </View>
          );
        }
      `,
      
      "src/components/ui/LoadingSpinner.tsx": `
        import React from 'react';
        import { View, ActivityIndicator } from 'react-native';
        import { commonStyles } from '@/theme/styles';
        import { colors } from '@/theme';
        
        interface LoadingSpinnerProps {
          size?: 'small' | 'large';
          color?: string;
        }
        
        export default function LoadingSpinner({
          size = 'large',
          color = colors.primary[500],
        }: LoadingSpinnerProps) {
          return (
            <View style={[commonStyles.container, commonStyles.center]}>
              <ActivityIndicator size={size} color={color} />
            </View>
          );
        }
      `
    },
    
    step2: "Create chart components",
    chart_components: {
      "src/components/charts/SalesChart.tsx": `
        import React from 'react';
        import { View, Text, Dimensions } from 'react-native';
        import { LineChart } from 'react-native-chart-kit';
        import { colors } from '@/theme';
        import { commonStyles } from '@/theme/styles';
        
        interface SalesChartProps {
          data: {
            labels: string[];
            datasets: {
              data: number[];
            }[];
          };
          title?: string;
        }
        
        export default function SalesChart({ data, title }: SalesChartProps) {
          const screenWidth = Dimensions.get('window').width;
          
          const chartConfig = {
            backgroundColor: colors.primary[500],
            backgroundGradientFrom: colors.primary[500],
            backgroundGradientTo: colors.primary[600],
            decimalPlaces: 2,
            color: (opacity = 1) => \`rgba(255, 255, 255, \${opacity})\`,
            labelColor: (opacity = 1) => \`rgba(255, 255, 255, \${opacity})\`,
          };
          
          return (
            <View style={commonStyles.card}>
              {title && (
                <Text style={commonStyles.subtitle}>{title}</Text>
              )}
              <LineChart
                data={data}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          );
        }
      `,
      
      "src/components/charts/InventoryChart.tsx": `
        import React from 'react';
        import { View, Text, Dimensions } from 'react-native';
        import { PieChart } from 'react-native-chart-kit';
        import { colors } from '@/theme';
        import { commonStyles } from '@/theme/styles';
        
        interface InventoryChartProps {
          data: {
            name: string;
            population: number;
            color: string;
            legendFontColor: string;
            legendFontSize: number;
          }[];
          title?: string;
        }
        
        export default function InventoryChart({ data, title }: InventoryChartProps) {
          const screenWidth = Dimensions.get('window').width;
          
          const chartConfig = {
            color: (opacity = 1) => \`rgba(26, 255, 146, \${opacity})\`,
          };
          
          return (
            <View style={commonStyles.card}>
              {title && (
                <Text style={commonStyles.subtitle}>{title}</Text>
              )}
              <PieChart
                data={data}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 50]}
                absolute
              />
            </View>
          );
        }
      `
    }
  },

  // PHASE 10: SCREEN IMPLEMENTATIONS
  phase10_screens: {
    step1: "Authentication screens",
    auth_screens: {
      "src/screens/auth/LoginScreen.tsx": `
        import React from 'react';
        import {
          View,
          Text,
          ScrollView,
          Alert,
          KeyboardAvoidingView,
          Platform,
        } from 'react-native';
        import { useForm, Controller } from 'react-hook-form';
        import { zodResolver } from '@hookform/resolvers/zod';
        import { useTranslation } from 'react-i18next';
        import { useAuthStore } from '@/stores/authStore';
        import { loginSchema } from '@/utils/validation';
        import Button from '@/components/ui/Button';
        import Input from '@/components/ui/Input';
        import { commonStyles } from '@/theme/styles';
        import { spacing } from '@/theme';
        
        type LoginFormData = {
          username: string;
          password: string;
        };
        
        export default function LoginScreen() {
          const { t } = useTranslation();
          const { login } = useAuthStore();
          
          const {
            control,
            handleSubmit,
            formState: { errors, isSubmitting },
          } = useForm<LoginFormData>({
            resolver: zodResolver(loginSchema),
          });
          
          const onSubmit = async (data: LoginFormData) => {
            try {
              await login(data);
            } catch (error) {
              Alert.alert(
                t('common.error'),
                t('auth.loginError')
              );
            }
          };
          
          return (
            <KeyboardAvoidingView
              style={commonStyles.container}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <ScrollView
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: 'center',
                  padding: spacing.lg,
                }}
              >
                <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
                  <Text style={commonStyles.title}>
                    {t('auth.welcomeBack')}
                  </Text>
                  <Text style={commonStyles.text}>
                    {t('auth.signInToContinue')}
                  </Text>
                </View>
                
                <View style={{ marginBottom: spacing.lg }}>
                  <Controller
                    control={control}
                    name="username"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label={t('auth.username')}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.username?.message}
                        autoCapitalize="none"
                        containerStyle={{ marginBottom: spacing.md }}
                        required
                      />
                    )}
                  />
                  
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label={t('auth.password')}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.password?.message}
                        secureTextEntry
                        containerStyle={{ marginBottom: spacing.lg }}
                        required
                      />
                    )}
                  />
                  
                  <Button
                    title={t('auth.signIn')}
                    onPress={handleSubmit(onSubmit)}
                    loading={isSubmitting}
                    fullWidth
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          );
        }
      `
    },
    
    step2: "MHC Dashboard screen example",
    mhc_dashboard: `
      // src/screens/mhc/DashboardScreen.tsx
      import React from 'react';
      import {
        View,
        Text,
        ScrollView,
        RefreshControl,
      } from 'react-native';
      import { useQuery } from '@tanstack/react-query';
      import { useTranslation } from 'react-i18next';
      import Card from '@/components/ui/Card';
      import LoadingSpinner from '@/components/ui/LoadingSpinner';
      import SalesChart from '@/components/charts/SalesChart';
      import { subsidiaryService, salesService } from '@/services';
      import { commonStyles } from '@/theme/styles';
      import { spacing, colors } from '@/theme';
      
      export default function MHCDashboardScreen() {
        const { t } = useTranslation();
        
        const { data: subsidiaries, isLoading: loadingSubsidiaries, refetch: refetchSubsidiaries } = useQuery({
          queryKey: ['subsidiaries'],
          queryFn: () => subsidiaryService.getAll(),
        });
        
        const { data: salesData, isLoading: loadingSales, refetch: refetchSales } = useQuery({
          queryKey: ['sales-analytics'],
          queryFn: () => salesService.getAnalytics(),
        });
        
        const isLoading = loadingSubsidiaries || loadingSales;
        
        const onRefresh = () => {
          refetchSubsidiaries();
          refetchSales();
        };
        
        if (isLoading) {
          return <LoadingSpinner />;
        }
        
        return (
          <ScrollView
            style={commonStyles.container}
            contentContainerStyle={{ padding: spacing.md }}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
            }
          >
            <Text style={commonStyles.title}>
              {t('dashboard.welcome')}
            </Text>
            
            {/* Stats Cards */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginBottom: spacing.lg,
            }}>
              <View style={{ width: '48%', marginRight: '2%', marginBottom: spacing.md }}>
                <Card>
                  <Text style={commonStyles.subtitle}>
                    {t('dashboard.totalSubsidiaries')}
                  </Text>
                  <Text style={{
                    fontSize: 32,
                    fontWeight: 'bold',
                    color: colors.primary[500],
                  }}>
                    {subsidiaries?.length || 0}
                  </Text>
                </Card>
              </View>
              
              <View style={{ width: '48%', marginLeft: '2%', marginBottom: spacing.md }}>
                <Card>
                  <Text style={commonStyles.subtitle}>
                    {t('dashboard.totalSales')}
                  </Text>
                  <Text style={{
                    fontSize: 32,
                    fontWeight: 'bold',
                    color: colors.success[500],
                  }}>
                    ${salesData?.totalSales || 0}
                  </Text>
                </Card>
              </View>
            </View>
            
            {/* Sales Chart */}
            {salesData?.chartData && (
              <SalesChart
                data={salesData.chartData}
                title={t('analytics.salesPerformance')}
              />
            )}
            
            {/* Recent Subsidiaries */}
            <Card>
              <Text style={commonStyles.subtitle}>
                {t('dashboard.recentSubsidiaries')}
              </Text>
              {subsidiaries?.slice(0, 5).map((subsidiary) => (
                <View
                  key={subsidiary.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: spacing.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.gray[200],
                  }}
                >
                  <View>
                    <Text style={commonStyles.text}>{subsidiary.name}</Text>
                    <Text style={{ color: colors.gray[500], fontSize: 12 }}>
                      {subsidiary.city}, {subsidiary.country}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: subsidiary.isActive ? colors.success[500] : colors.gray[400],
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: 12,
                  }}>
                    <Text style={{ color: 'white', fontSize: 12 }}>
                      {subsidiary.isActive ? t('common.active') : t('common.inactive')}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </ScrollView>
        );
      }
    `
  },

  // PHASE 11: ADVANCED FEATURES
  phase11_advanced: {
    step1: "PDF Report Generation",
    pdf_generation: `
      // src/utils/pdfGenerator.ts
      import * as Print from 'expo-print';
      import * as Sharing from 'expo-sharing';
      
      interface ReportData {
        title: string;
        data: any[];
        headers: string[];
        subsidiary?: {
          name: string;
          logo?: string;
        };
      }
      
      export const generatePDFReport = async (reportData: ReportData) => {
        const htmlContent = \`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>\${reportData.title}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { max-width: 100px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="header">
                \${reportData.subsidiary?.logo ? \`<img src="\${reportData.subsidiary.logo}" class="logo" />\` : ''}
                <h1>\${reportData.title}</h1>
                \${reportData.subsidiary ? \`<p>\${reportData.subsidiary.name}</p>\` : ''}
                <p>Generated on \${new Date().toLocaleDateString()}</p>
              </div>
              
              <table>
                <thead>
                  <tr>
                    \${reportData.headers.map(header => \`<th>\${header}</th>\`).join('')}
                  </tr>
                </thead>
                <tbody>
                  \${reportData.data.map(row => 
                    \`<tr>\${reportData.headers.map(header => \`<td>\${row[header] || ''}</td>\`).join('')}</tr>\`
                  ).join('')}
                </tbody>
              </table>
              
              <div class="footer">
                <p>© \${new Date().getFullYear()} \${reportData.subsidiary?.name || 'Company Name'}</p>
              </div>
            </body>
          </html>
        \`;
        
        try {
          const { uri } = await Print.printToFileAsync({
            html: htmlContent,
            base64: false,
          });
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri);
          }
          
          return uri;
        } catch (error) {
          console.error('Error generating PDF:', error);
          throw error;
        }
      };
    `,
    
    step2: "Image picker for subsidiary logos",
    image_picker: `
      // src/utils/imagePicker.ts
      import * as ImagePicker from 'expo-image-picker';
      import * as ImageManipulator from 'expo-image-manipulator';
      
      export const pickAndResizeImage = async (): Promise<string | null> => {
        try {
          // Request permission
          const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
          
          if (permissionResult.granted === false) {
            alert('Permission to access camera roll is required!');
            return null;
          }
          
          // Pick image
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
          });
          
          if (!result.canceled && result.assets[0]) {
            // Resize image
            const manipResult = await ImageManipulator.manipulateAsync(
              result.assets[0].uri,
              [{ resize: { width: 200, height: 200 } }],
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );
            
            return manipResult.uri;
          }
          
          return null;
        } catch (error) {
          console.error('Error picking image:', error);
          return null;
        }
      };
    `,
    
    step3: "Offline support with React Query",
    offline_support: `
      // src/hooks/useOfflineSupport.ts
      import { useQuery, useQueryClient } from '@tanstack/react-query';
      import AsyncStorage from '@react-native-async-storage/async-storage';
      import NetInfo from '@react-native-netinfo/netinfo';
      import { useEffect, useState } from 'react';
      
      export const useOfflineSupport = () => {
        const [isOnline, setIsOnline] = useState(true);
        const queryClient = useQueryClient();
        
        useEffect(() => {
          const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected ?? true);
            
            if (state.isConnected) {
              // Retry failed queries when coming back online
              queryClient.resumePausedMutations();
              queryClient.invalidateQueries();
            }
          });
          
          return unsubscribe;
        }, [queryClient]);
        
        const cacheData = async (key: string, data: any) => {
          try {
            await AsyncStorage.setItem(\`cache_\${key}\`, JSON.stringify(data));
          } catch (error) {
            console.error('Error caching data:', error);
          }
        };
        
        const getCachedData = async (key: string) => {
          try {
            const cached = await AsyncStorage.getItem(\`cache_\${key}\`);
            return cached ? JSON.parse(cached) : null;
          } catch (error) {
            console.error('Error getting cached data:', error);
            return null;
          }
        };
        
        return {
          isOnline,
          cacheData,
          getCachedData,
        };
      };
    `
  },

  // PHASE 12: TESTING AND DEPLOYMENT
  phase12_testing: {
    step1: "Setup testing framework",
    testing_setup: {
      dependencies: [
        "@testing-library/react-native",
        "@testing-library/jest-native",
        "jest-expo",
        "react-test-renderer"
      ],
      jest_config: `
        // jest.config.js
        module.exports = {
          preset: 'jest-expo',
          setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
          transformIgnorePatterns: [
            'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
          ],
        };
      `
    },
    
    step2: "Example test files",
    test_examples: {
      "src/__tests__/components/Button.test.tsx": `
        import React from 'react';
        import { render, fireEvent } from '@testing-library/react-native';
        import Button from '@/components/ui/Button';
        
        describe('Button Component', () => {
          it('renders correctly', () => {
            const { getByText } = render(<Button title="Test Button" />);
            expect(getByText('Test Button')).toBeTruthy();
          });
          
          it('calls onPress when pressed', () => {
            const mockOnPress = jest.fn();
            const { getByText } = render(
              <Button title="Test Button" onPress={mockOnPress} />
            );
            
            fireEvent.press(getByText('Test Button'));
            expect(mockOnPress).toHaveBeenCalledTimes(1);
          });
          
          it('shows loading state', () => {
            const { getByTestId } = render(
              <Button title="Test Button" loading testID="button" />
            );
            
            expect(getByTestId('button')).toBeTruthy();
          });
        });
      `,
      
      "src/__tests__/screens/LoginScreen.test.tsx": `
        import React from 'react';
        import { render, fireEvent, waitFor } from '@testing-library/react-native';
        import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
        import LoginScreen from '@/screens/auth/LoginScreen';
        import { useAuthStore } from '@/stores/authStore';
        
        // Mock the auth store
        jest.mock('@/stores/authStore');
        
        const createTestQueryClient = () =>
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          });
        
        const Wrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={createTestQueryClient()}>
            {children}
          </QueryClientProvider>
        );
        
        describe('LoginScreen', () => {
          beforeEach(() => {
            (useAuthStore as jest.Mock).mockReturnValue({
              login: jest.fn(),
            });
          });
          
          it('renders login form', () => {
            const { getByText } = render(<LoginScreen />, { wrapper: Wrapper });
            
            expect(getByText('auth.username')).toBeTruthy();
            expect(getByText('auth.password')).toBeTruthy();
            expect(getByText('auth.signIn')).toBeTruthy();
          });
          
          it('validates form fields', async () => {
            const { getByText, getByPlaceholderText } = render(<LoginScreen />, {
              wrapper: Wrapper,
            });
            
            const submitButton = getByText('auth.signIn');
            fireEvent.press(submitButton);
            
            await waitFor(() => {
              expect(getByText('Username is required')).toBeTruthy();
              expect(getByText('Password is required')).toBeTruthy();
            });
          });
        });
      `
    }
  },

  // PHASE 13: DEPLOYMENT CONFIGURATION
  phase13_deployment: {
    step1: "Configure app.json for Expo",
    app_config: `
      {
        "expo": {
          "name": "MultiTenant Business App",
          "slug": "multitenant-business",
          "version": "1.0.0",
          "orientation": "portrait",
          "icon": "./assets/icon.png",
          "userInterfaceStyle": "light",
          "splash": {
            "image": "./assets/splash.png",
            "resizeMode": "contain",
            "backgroundColor": "#ffffff"
          },
          "assetBundlePatterns": [
            "**/*"
          ],
          "ios": {
            "supportsTablet": true,
            "bundleIdentifier": "com.yourcompany.multitenantbusiness"
          },
          "android": {
            "adaptiveIcon": {
              "foregroundImage": "./assets/adaptive-icon.png",
              "backgroundColor": "#FFFFFF"
            },
            "package": "com.yourcompany.multitenantbusiness"
          },
          "web": {
            "favicon": "./assets/favicon.png"
          },
          "plugins": [
            "expo-router",
            "expo-image-picker",
            "expo-document-picker",
            [
              "expo-build-properties",
              {
                "android": {
                  "enableProguardInReleaseBuilds": true
                }
              }
            ]
          ],
          "extra": {
            "eas": {
              "projectId": "your-project-id"
            }
          }
        }
      }
    `,
    
    step2: "Environment configuration",
    env_config: `
      // src/config/environment.ts
      import Constants from 'expo-constants';
      
      const ENV = {
        dev: {
          apiUrl: 'http://localhost:5000/api',
          websocketUrl: 'ws://localhost:5000',
        },
        staging: {
          apiUrl: 'https://staging-api.yourapp.com/api',
          websocketUrl: 'wss://staging-api.yourapp.com',
        },
        prod: {
          apiUrl: 'https://api.yourapp.com/api',
          websocketUrl: 'wss://api.yourapp.com',
        },
      };
      
      const getEnvVars = () => {
        if (__DEV__) {
          return ENV.dev;
        } else if (Constants.manifest?.releaseChannel === 'staging') {
          return ENV.staging;
        } else {
          return ENV.prod;
        }
      };
      
      export default getEnvVars();
    `
  },

  // PHASE 14: FINAL IMPLEMENTATION CHECKLIST
  phase14_checklist: {
    implementation_order: [
      "1. Complete Phase 1-3: Setup project, install dependencies, create types",
      "2. Implement Phase 4-5: Theme system and state management",
      "3. Build Phase 6-7: API services and internationalization",
      "4. Create Phase 8-9: Navigation and reusable components",
      "5. Develop Phase 10: All screen implementations (prioritize by user role)",
      "6. Add Phase 11: Advanced features (PDF generation, image handling, offline support)",
      "7. Complete Phase 12-13: Testing and deployment configuration",
      "8. Final testing and optimization"
    ],
    
    key_considerations: [
      "Platform-specific optimizations for iOS and Android",
      "Accessibility compliance (screen readers, color contrast)",
      "Performance optimization (lazy loading, image caching)",
      "Security considerations (secure storage, API authentication)",
      "Error handling and user feedback",
      "Offline capabilities and data synchronization",
      "Push notifications setup (optional)",
      "Analytics integration (optional)",
      "App store submission requirements"
    ],
    
    testing_strategy: [
      "Unit tests for utilities and pure functions",
      "Component tests for UI components",
      "Integration tests for API services",
      "End-to-end tests for critical user flows",
      "Performance testing on various devices",
      "Accessibility testing",
      "Security testing for authentication flows"
    ]
  },

  migration_notes: {
    web_to_mobile_considerations: [
      "Replace React Router with React Navigation",
      "Convert HTML/CSS layouts to React Native Views and StyleSheet",
      "Replace browser APIs with Expo/React Native equivalents",
      "Adapt touch interactions for mobile (gestures, swipes)",
      "Optimize for different screen sizes and orientations",
      "Handle mobile-specific concerns (battery, network, permissions)",
      "Implement mobile-friendly data entry (date pickers, dropdowns)",
      "Add pull-to-refresh and infinite scrolling patterns"
    ],
    
    backend_integration: [
      "Use the existing Express.js API without modifications",
      "Implement proper authentication token handling",
      "Add WebSocket support for real-time updates (optional)",
      "Handle network errors and retry logic",
      "Implement proper data caching strategies",
      "Add support for file uploads (images, documents)"
    ]
  }
};

// Export for use by Replit Assistant
console.log('Multi-Tenant Mobile App Migration Instructions Generated');
console.log('Total phases:', Object.keys(migrationInstructions).length - 1);
console.log('Ready for implementation with Expo React Native');

export default migrationInstructions;