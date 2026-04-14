# Habit Tracker - React Native (Expo)

A cross-platform habit tracking app built with React Native and Expo. Track daily habits, maintain streaks, and view detailed statistics.

## Features

- **Habit Management**: Create, edit, and delete habits with custom colors and target days
- **Daily Check-ins**: Toggle daily completions with a single tap
- **Streak Tracking**: Automatic consecutive-day streak calculation 🔥
- **Statistics Dashboard**: View current streaks, total check-ins, and achievement badges
- **Local Storage**: All data persisted locally using AsyncStorage
- **Material Design**: Clean, modern UI inspired by Material Design 3

## Screens

1. **Habits** - Main screen showing all habits with daily check-in toggle and streak badges
2. **New/Edit Habit** - Form with name, description, color picker, and target days selector
3. **Statistics** - Per-habit stats cards with streaks, totals, and achievement badges

## Tech Stack

- **React Native** with **Expo** SDK
- **TypeScript** for type safety
- **React Navigation** (Stack + Bottom Tabs)
- **AsyncStorage** for local data persistence
- **Custom hooks** with `useFocusEffect` for data refresh

## Getting Started

```bash
# Install dependencies
npm install

# Start the Expo dev server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

## Project Structure

```
src/
├── models/
│   └── types.ts          # TypeScript interfaces
├── navigation/
│   └── AppNavigator.tsx   # Stack + Tab navigation
├── screens/
│   ├── HabitListScreen.tsx    # Main habit list
│   ├── HabitDetailScreen.tsx  # Create/edit form
│   └── StatsScreen.tsx        # Statistics dashboard
└── storage/
    └── habitStorage.ts    # AsyncStorage CRUD operations
```

## Based On

Port of the [habit-tracker-android](https://github.com/Rybak1234/habit-tracker-android) Kotlin/Android app, maintaining feature parity with a cross-platform approach.
