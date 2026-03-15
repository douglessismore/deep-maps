import type { StoryCategory } from '../types';

interface CategoryConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const CATEGORIES: Record<StoryCategory, CategoryConfig> = {
  'dark-history': {
    label: 'Dark History',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.15)',
    borderColor: 'rgba(220, 38, 38, 0.4)',
  },
  'battles-conflicts': {
    label: 'Battles & Conflicts',
    color: '#d97706',
    bgColor: 'rgba(217, 119, 6, 0.15)',
    borderColor: 'rgba(217, 119, 6, 0.4)',
  },
  'discovery-science': {
    label: 'Discovery & Science',
    color: '#0891b2',
    bgColor: 'rgba(8, 145, 178, 0.15)',
    borderColor: 'rgba(8, 145, 178, 0.4)',
  },
  'arts-culture': {
    label: 'Arts & Culture',
    color: '#9333ea',
    bgColor: 'rgba(147, 51, 234, 0.15)',
    borderColor: 'rgba(147, 51, 234, 0.4)',
  },
  'mystery-unexplained': {
    label: 'Mystery & Unexplained',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.15)',
    borderColor: 'rgba(5, 150, 105, 0.4)',
  },
  'political-drama': {
    label: 'Political Drama',
    color: '#4f46e5',
    bgColor: 'rgba(79, 70, 229, 0.15)',
    borderColor: 'rgba(79, 70, 229, 0.4)',
  },
  'everyday-extraordinary': {
    label: 'Everyday Extraordinary',
    color: '#ca8a04',
    bgColor: 'rgba(202, 138, 4, 0.15)',
    borderColor: 'rgba(202, 138, 4, 0.4)',
  },
  'sacred-history': {
    label: 'Sacred History',
    color: '#be185d',
    bgColor: 'rgba(190, 24, 93, 0.15)',
    borderColor: 'rgba(190, 24, 93, 0.4)',
  },
};

export const IMPORTANCE_SIZE: Record<string, number> = {
  major: 14,
  minor: 10,
  contextual: 7,
};
