// Mock user personas for simulating different roles
export interface UserPersona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
  color: string; // Color theme for their messages
}

export const USER_PERSONAS: UserPersona[] = [
  {
    id: 'recruiter-1',
    name: 'You (Alex Rivera)',
    role: 'Senior Recruiter',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    email: 'alex.rivera@company.com',
    color: 'blue'
  },
  {
    id: 'recruiter-2',
    name: 'Sarah Chen',
    role: 'Technical Recruiter',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop',
    email: 'sarah.chen@company.com',
    color: 'purple'
  },
  {
    id: 'hiring-manager-1',
    name: 'Michael Torres',
    role: 'Engineering Manager',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    email: 'michael.torres@company.com',
    color: 'green'
  },
  {
    id: 'hiring-manager-2',
    name: 'Emily Watson',
    role: 'Head of Product',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
    email: 'emily.watson@company.com',
    color: 'pink'
  },
  {
    id: 'cto-1',
    name: 'David Kim',
    role: 'CTO',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop',
    email: 'david.kim@company.com',
    color: 'orange'
  }
];

// Default user (the main recruiter account)
export const DEFAULT_USER = USER_PERSONAS[0];

// Get color classes for a user
export const getUserColors = (userId: string) => {
  const user = USER_PERSONAS.find(u => u.id === userId) || DEFAULT_USER;

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: {
      bg: 'bg-blue-500',
      text: 'text-blue-400',
      border: 'border-blue-500/30'
    },
    purple: {
      bg: 'bg-purple-500',
      text: 'text-purple-400',
      border: 'border-purple-500/30'
    },
    green: {
      bg: 'bg-green-500',
      text: 'text-green-400',
      border: 'border-green-500/30'
    },
    pink: {
      bg: 'bg-pink-500',
      text: 'text-pink-400',
      border: 'border-pink-500/30'
    },
    orange: {
      bg: 'bg-orange-500',
      text: 'text-orange-400',
      border: 'border-orange-500/30'
    }
  };

  return colorMap[user.color] || colorMap.blue;
};
