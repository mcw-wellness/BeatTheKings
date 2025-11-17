'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { User, Avatar, PlayerStats, SportType } from '@/types';
import { calculateAgeGroup } from '@/lib/utils';
import { mockUser, mockPlayerStats, mockAvatars } from '@/lib/mockData';

interface AppContextType {
  // User data
  user: Partial<User>;
  updateUser: (data: Partial<User>) => void;
  setUserEmail: (email: string) => void;
  setUserProfile: (name: string, age: number, gender: string, location: string) => void;
  setProfilePicture: (url: string) => void;

  // Avatar data
  avatar: Avatar | null;
  createAvatar: (hairColor: string, hairStyle: string, jerseyNumber: number, items: any) => void;

  // Stats
  stats: PlayerStats | null;
  updateStats: (xp: number, challenges: number) => void;

  // App state
  hasAvatar: boolean;
  canAccessFeatures: boolean;
  selectedSport: SportType;
  setSelectedSport: (sport: SportType) => void;

  // Onboarding
  completeOnboarding: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Partial<User>>({ ...mockUser });
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [selectedSport, setSelectedSport] = useState<SportType>('basketball');

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAvatar = localStorage.getItem('avatar_data');
      const savedUser = localStorage.getItem('user_data');

      console.log('AppContext - Loading from localStorage:');
      console.log('savedAvatar:', savedAvatar);
      console.log('savedUser:', savedUser);

      if (savedAvatar) {
        try {
          const parsedAvatar = JSON.parse(savedAvatar);
          console.log('Parsed avatar:', parsedAvatar);
          setAvatar(parsedAvatar);
        } catch (e) {
          console.error('Failed to parse avatar data', e);
        }
      }

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('Parsed user:', parsedUser);
          setUser(prev => ({ ...prev, ...parsedUser }));
        } catch (e) {
          console.error('Failed to parse user data', e);
        }
      }
    }
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => ({ ...prev, ...data }));
  }, []);

  const setUserEmail = useCallback((email: string) => {
    setUser(prev => ({
      ...prev,
      email,
      emailVerified: true, // Mock: auto-verify
    }));
  }, []);

  const setUserProfile = useCallback((name: string, age: number, gender: string, location: string) => {
    const ageGroup = calculateAgeGroup(age);
    setUser(prev => ({
      ...prev,
      name,
      age,
      ageGroup,
      gender,
      location,
    }));
  }, []);

  const setProfilePicture = useCallback((url: string) => {
    setUser(prev => ({
      ...prev,
      profilePictureUrl: url,
    }));
  }, []);

  const createAvatar = useCallback(
    (hairColor: string, hairStyle: string, jerseyNumber: number, items: any) => {
      const now = new Date().toISOString();
      const newAvatar: Avatar = {
        id: 'avatar-current',
        userId: user.id || 'user-1',
        hairColor,
        hairStyle,
        jerseyNumber,
        equippedItems: items,
        createdAt: now as any,
        updatedAt: now as any,
      };

      console.log('Creating avatar:', newAvatar);
      setAvatar(newAvatar);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('avatar_data', JSON.stringify(newAvatar));
        console.log('Saved to localStorage - avatar_data');
      }

      // Initialize stats when avatar is created
      const newStats = {
        id: 'stats-current',
        userId: user.id || 'user-1',
        totalXp: 0,
        currentRank: 999,
        totalChallenges: 0,
        sportType: selectedSport,
        venueStatsJson: {},
        updatedAt: now as any,
      };
      setStats(newStats);
    },
    [user.id, selectedSport]
  );

  const updateStats = useCallback((xp: number, challenges: number) => {
    setStats(prev => {
      if (!prev) return null;
      return {
        ...prev,
        totalXp: prev.totalXp + xp,
        totalChallenges: prev.totalChallenges + challenges,
        updatedAt: new Date(),
      };
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    const updatedUser = {
      hasCompletedOnboarding: true,
    };
    console.log('Completing onboarding, setting hasCompletedOnboarding to true');
    setUser(prev => ({
      ...prev,
      ...updatedUser,
    }));

    // Save to localStorage
    if (typeof window !== 'undefined') {
      const currentUser = localStorage.getItem('user_data');
      const userData = currentUser ? JSON.parse(currentUser) : {};
      const finalUserData = { ...userData, ...updatedUser };
      localStorage.setItem('user_data', JSON.stringify(finalUserData));
      console.log('Saved to localStorage - user_data:', finalUserData);
    }
  }, []);

  const hasAvatar = avatar !== null;
  const canAccessFeatures = user.hasCompletedOnboarding === true && hasAvatar;

  return (
    <AppContext.Provider
      value={{
        user,
        updateUser,
        setUserEmail,
        setUserProfile,
        setProfilePicture,
        avatar,
        createAvatar,
        stats,
        updateStats,
        hasAvatar,
        canAccessFeatures,
        selectedSport,
        setSelectedSport,
        completeOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}