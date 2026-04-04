export const ChatIcon = ({ className = "w-6 h-6 text-[#6b21a8]" }) => (
  <svg viewBox="0 0 50 50" fill="none" className={className}>
    
    <path
      d="M35.8 12.1c2.1 2.7 3.3 6.1 3.3 9.8C39.1 30.8 31.9 38 23 38c-2.5 0-4.8-0.6-6.9-1.6l-0.7 0.7v6l3.7-3.7c2.1 1 4.4 1.6 6.9 1.6c8.9 0 16.1-7.2 16.1-16.1c0-5.2-2.5-9.8-6.3-12.8z"
      fill="currentColor"
      opacity="0.2"
    />

    <path
      d="M13.8 43.6v-7.3c-3.5-3.2-5.5-7.7-5.5-12.4c0-9.2 7.5-16.7 16.7-16.7s16.7 7.5 16.7 16.7S34.2 40.6 25 40.6c-2.3 0-4.6-0.5-6.8-1.5L13.8 43.6z"
      stroke="currentColor"
      strokeWidth="1.6"
      fill="none"
    />

    <path
      d="M25 32.6l-6.8-6.8c-1.8-1.8-1.8-4.7 0-6.5c1.8-1.8 4.7-1.8 6.5 0l0.7 0.7l0.7-0.7c1.8-1.8 4.7-1.8 6.5 0c1.8 1.8 1.8 4.7 0 6.5L25 32.6z"
      stroke="currentColor"
      strokeWidth="1.6"
      fill="none"
    />

  </svg>
);

export const MoodIcon = ({ className = "w-6 h-6 text-[#6b21a8]" }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>

    {/* Outer circle */}
    <path
      d="M24 6C14.0589 6 6 14.0589 6 24C6 33.9411 14.0589 42 24 42C33.9411 42 42 33.9411 42 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Inner circle */}
    <path
      d="M24 15C19.0294 15 15 19.0294 15 24C15 28.9706 19.0294 33 24 33C28.9706 33 33 28.9706 33 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Needle */}
    <path
      d="M24 24L30.3 17.7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Indicator shape */}
    <path
      d="M30.3 11.4V17.7H36.6L42 12.3H35.7V6L30.3 11.4Z"
      fill="currentColor"
      opacity="0.2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />

  </svg>
);

export const SupportIcon = ({ className = "w-6 h-6 text-[#6b21a8]" }) => (
  <svg viewBox="0 0 512 512" fill="none" className={className}>
    
    <path
      d="M422 260v-30c0-110-70-200-166-200S90 120 90 230v30c-26 6-44 30-44 60s25 60 60 60s60-25 60-60v-30c0-30-20-55-48-60c4-60 35-150 138-150s134 90 138 150c-28 5-48 30-48 60v30c0 28 15 52 38 64c-10 20-35 45-100 55c-10-20-30-30-52-22s-34 32-30 55c4 24 25 40 50 40c20 0 38-10 46-28c95-10 125-60 134-90c25-6 42-30 42-60s-18-54-44-60z"
      stroke="currentColor"
      strokeWidth="18"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />

  </svg>
);