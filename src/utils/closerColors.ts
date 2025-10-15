export const CLOSERS = ['Gabriel', 'Uilma', 'Lucas', 'Vagner'] as const;

export type Closer = typeof CLOSERS[number];

export const getCloserColor = (closer: string | null | undefined): string => {
  if (!closer) return '';
  
  switch (closer) {
    case 'Gabriel': 
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    case 'Uilma': 
      return 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800';
    case 'Lucas': 
      return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
    case 'Vagner': 
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    default: 
      return '';
  }
};

export const getCloserDotColor = (closer: string | null | undefined): string => {
  if (!closer) return 'bg-gray-400';
  
  switch (closer) {
    case 'Gabriel': return 'bg-yellow-400';
    case 'Uilma': return 'bg-pink-400';
    case 'Lucas': return 'bg-purple-400';
    case 'Vagner': return 'bg-blue-400';
    default: return 'bg-gray-400';
  }
};

export const getCloserBorderColor = (closer: string | null | undefined): string => {
  if (!closer) return 'transparent';
  
  switch (closer) {
    case 'Gabriel': return 'rgb(250, 204, 21)'; // yellow-400
    case 'Uilma': return 'rgb(244, 114, 182)'; // pink-400
    case 'Lucas': return 'rgb(168, 85, 247)'; // purple-400
    case 'Vagner': return 'rgb(96, 165, 250)'; // blue-400
    default: return 'transparent';
  }
};
