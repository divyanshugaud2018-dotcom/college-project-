import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, Check, User, Wand2, Palette, Glasses, Shirt, Smile, Shield } from 'lucide-react';

interface AvatarCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAvatar: (avatarDataUrl: string) => void;
  initialGender?: 'male' | 'female';
}

export interface AvatarOptions {
  gender: 'male' | 'female' | 'unisex';
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeType: string;
  eyeColor: string;
  mouthType: string;
  facialHair: string;
  glasses: string;
  clothing: string;
  clothingColor: string;
  accessory: string;
  bgType: string;
  bgColor: string;
}

const SKIN_TONES = [
  { name: 'Peach', color: '#FCD5CE' },
  { name: 'Fair', color: '#F7D6C8' },
  { name: 'Wheat', color: '#E8B48F' },
  { name: 'Olive', color: '#C68B59' },
  { name: 'Warm Tan', color: '#A56535' },
  { name: 'Deep Ebony', color: '#5C3822' },
];

const HAIR_COLORS = [
  { name: 'Black', color: '#1B1B1B' },
  { name: 'Dark Brown', color: '#4A2E2B' },
  { name: 'Chestnut', color: '#7B4226' },
  { name: 'Blonde', color: '#E6C687' },
  { name: 'Auburn', color: '#A03623' },
  { name: 'Silver', color: '#B2B2B2' },
  { name: 'Pastel Blue', color: '#62B6CB' },
  { name: 'Neon Violet', color: '#9B5DE5' },
];

const CLOTHING_COLORS = [
  { name: 'College Indigo', color: '#4F46E5' },
  { name: 'Emerald', color: '#10B981' },
  { name: 'Rose', color: '#F43F5E' },
  { name: 'Amber Gold', color: '#F59E0B' },
  { name: 'Charcoal', color: '#334155' },
  { name: 'Cyan Tech', color: '#06B6D4' },
  { name: 'Purple Sunset', color: '#8B5CF6' },
];

const BG_COLORS = [
  { name: 'Indigo Gradient', color: '#6366F1', secondary: '#3730A3' },
  { name: 'Emerald Glow', color: '#10B981', secondary: '#065F46' },
  { name: 'Rose Sunset', color: '#F43F5E', secondary: '#881337' },
  { name: 'Amber Warmth', color: '#F59E0B', secondary: '#78350F' },
  { name: 'Cyber Blue', color: '#0284C7', secondary: '#0F172A' },
  { name: 'Dark Luxury', color: '#1E293B', secondary: '#0F172A' },
];

const HAIR_STYLES = [
  // SHORT HAIR OPTIONS
  { id: 'short_clean', name: 'Short Clean Fade', gender: 'male', category: 'short' },
  { id: 'short_spikes', name: 'Short Spiky Crop', gender: 'male', category: 'short' },
  { id: 'short_buzz', name: 'Short Buzz Cut', gender: 'male', category: 'short' },
  { id: 'short_side_part', name: 'Short Side Part', gender: 'male', category: 'short' },
  { id: 'short_pixie', name: 'Short Pixie Cut', gender: 'female', category: 'short' },
  { id: 'short_bob', name: 'Short Chin Bob', gender: 'female', category: 'short' },
  { id: 'short_undercut', name: 'Short Modern Undercut', gender: 'unisex', category: 'short' },

  // FULL / LONG HAIR OPTIONS
  { id: 'full_afro_volume', name: 'Full Volume Afro Curls', gender: 'unisex', category: 'full' },
  { id: 'full_curly_top', name: 'Full Curly Crown', gender: 'male', category: 'full' },
  { id: 'full_slick_back', name: 'Full Slicked Back', gender: 'male', category: 'full' },
  { id: 'full_long_straight', name: 'Full Long Straight', gender: 'female', category: 'full' },
  { id: 'full_wavy_glam', name: 'Full Wavy Glamour', gender: 'female', category: 'full' },
  { id: 'full_bob_bangs', name: 'Full Volume Bob & Bangs', gender: 'female', category: 'full' },
  { id: 'full_ponytail', name: 'Full High Ponytail', gender: 'female', category: 'full' },
  { id: 'hijab', name: 'Full Campus Hijab', gender: 'female', category: 'full' },
  { id: 'beanie_cap', name: 'Full Beanie & Locks', gender: 'unisex', category: 'full' },
];

const OUTFITS = [
  { id: 'hoodie', name: 'College Hoodie' },
  { id: 'tshirt', name: 'Casual Graphic Tee' },
  { id: 'jacket', name: 'Denim Jacket' },
  { id: 'varsity', name: 'Varsity College Jacket' },
  { id: 'labcoat', name: 'Science Lab Coat' },
  { id: 'blazer', name: 'Formal Blazer' },
];

const EYE_TYPES = [
  { id: 'happy', name: 'Bright & Happy' },
  { id: 'wink', name: 'Playful Wink' },
  { id: 'anime', name: 'Anime Sparkle' },
  { id: 'chill', name: 'Cool & Relaxed' },
];

const GLASSES_OPTIONS = [
  { id: 'none', name: 'No Glasses' },
  { id: 'classic', name: 'Round Tech Specs' },
  { id: 'cool_shades', name: 'Cool Dark Shades' },
  { id: 'square_frames', name: 'Square Academic Frames' },
];

const ACCESSORIES = [
  { id: 'none', name: 'None' },
  { id: 'headphones', name: 'Over-Ear Headphones' },
  { id: 'earrings', name: 'Gold Hoop Earrings' },
  { id: 'badge', name: 'Campus ID Badge' },
];

export const generateCartoonSvg = (opt: AvatarOptions): string => {
  const skin = opt.skinTone;
  const hairC = opt.hairColor;
  const clothC = opt.clothingColor;
  const bg = BG_COLORS.find((b) => b.color === opt.bgColor) || BG_COLORS[0];

  // SVG dimensions: 200x200
  let backHairPath = '';
  let frontHairPath = '';

  if (opt.hairStyle === 'short_clean') {
    frontHairPath = `
      <path d="M 58 88 Q 60 48 100 48 Q 140 48 142 88 Q 128 78 100 78 Q 72 78 58 88 Z" fill="${hairC}" />
      <path d="M 56 84 Q 56 96 62 102 Q 62 88 56 84 Z" fill="${hairC}" />
      <path d="M 144 84 Q 144 96 138 102 Q 138 88 144 84 Z" fill="${hairC}" />
    `;
  } else if (opt.hairStyle === 'short_spikes') {
    frontHairPath = `
      <path d="M 54 86 L 58 48 L 72 58 L 82 38 L 100 52 L 118 38 L 128 58 L 142 48 L 146 86 Q 125 74 100 74 Q 75 74 54 86 Z" fill="${hairC}" />
    `;
  } else if (opt.hairStyle === 'short_buzz') {
    frontHairPath = `
      <path d="M 58 90 Q 58 50 100 50 Q 142 50 142 90 Q 125 82 100 82 Q 75 82 58 90 Z" fill="${hairC}" opacity="0.95" />
    `;
  } else if (opt.hairStyle === 'short_side_part') {
    frontHairPath = `
      <path d="M 56 86 Q 58 45 100 45 Q 142 45 144 86 Q 130 72 100 72 Q 70 72 56 86 Z" fill="${hairC}" />
      <path d="M 72 48 L 76 80" stroke="#FFFFFF" stroke-width="1.5" opacity="0.25" />
    `;
  } else if (opt.hairStyle === 'short_pixie') {
    frontHairPath = `
      <path d="M 54 85 Q 58 45 100 45 Q 142 45 146 85 Q 130 75 110 88 Q 90 75 54 85 Z" fill="${hairC}" />
      <path d="M 68 82 Q 85 92 100 82" stroke="${hairC}" stroke-width="4" fill="none" />
    `;
  } else if (opt.hairStyle === 'short_bob') {
    backHairPath = `<path d="M 52 82 Q 100 38 148 82 L 152 135 Q 135 130 130 105 Q 100 85 70 105 Q 65 130 48 135 Z" fill="${hairC}" />`;
    frontHairPath = `
      <path d="M 54 82 Q 58 46 100 46 Q 142 46 146 82 Q 125 75 100 75 Q 75 75 54 82 Z" fill="${hairC}" />
    `;
  } else if (opt.hairStyle === 'short_undercut') {
    frontHairPath = `
      <path d="M 56 85 Q 58 42 100 42 Q 142 42 144 85 Q 125 72 100 72 Q 75 72 56 85 Z" fill="${hairC}" />
      <path d="M 58 85 Q 58 102 64 102 Q 62 88 58 85 Z" fill="${hairC}" opacity="0.6" />
      <path d="M 142 85 Q 142 102 136 102 Q 138 88 142 85 Z" fill="${hairC}" opacity="0.6" />
    `;
  } else if (opt.hairStyle === 'full_afro_volume') {
    backHairPath = `<circle cx="100" cy="80" r="58" fill="${hairC}" />`;
    frontHairPath = `
      <circle cx="100" cy="80" r="54" fill="${hairC}" />
      <path d="M 65 82 Q 100 68 135 82" stroke="${hairC}" stroke-width="6" fill="none" />
    `;
  } else if (opt.hairStyle === 'full_curly_top') {
    frontHairPath = `
      <circle cx="72" cy="62" r="16" fill="${hairC}" />
      <circle cx="90" cy="50" r="20" fill="${hairC}" />
      <circle cx="110" cy="50" r="20" fill="${hairC}" />
      <circle cx="128" cy="62" r="16" fill="${hairC}" />
      <circle cx="100" cy="65" r="22" fill="${hairC}" />
      <path d="M 62 82 Q 100 72 138 82" fill="${hairC}" />
    `;
  } else if (opt.hairStyle === 'full_slick_back') {
    frontHairPath = `
      <path d="M 56 85 Q 58 42 100 42 Q 142 42 144 85 Q 125 76 100 76 Q 75 76 56 85 Z" fill="${hairC}" />
      <path d="M 80 44 L 80 72 M 100 43 L 100 72 M 120 44 L 120 72" stroke="#FFFFFF" stroke-width="1.5" opacity="0.2" />
    `;
  } else if (opt.hairStyle === 'full_long_straight') {
    backHairPath = `
      <path d="M 45 75 Q 100 30 155 75 L 162 170 Q 135 175 130 135 Q 100 95 70 135 Q 65 175 38 170 Z" fill="${hairC}" />
    `;
    frontHairPath = `
      <path d="M 52 82 Q 56 42 100 42 Q 144 42 148 82 Q 135 76 100 76 Q 65 76 52 82 Z" fill="${hairC}" />
      <path d="M 58 82 Q 80 92 100 84 Q 120 92 142 82" stroke="${hairC}" stroke-width="3" fill="none" />
    `;
  } else if (opt.hairStyle === 'full_wavy_glam') {
    backHairPath = `
      <path d="M 42 75 Q 100 25 158 75 Q 170 120 155 172 Q 135 145 130 110 Q 100 85 70 110 Q 65 145 45 172 Q 30 120 42 75 Z" fill="${hairC}" />
    `;
    frontHairPath = `
      <path d="M 50 80 Q 56 38 100 38 Q 144 38 150 80 Q 135 74 100 74 Q 65 74 50 80 Z" fill="${hairC}" />
      <path d="M 58 78 Q 75 92 100 82 Q 125 92 142 78" stroke="${hairC}" stroke-width="4" fill="none" />
    `;
  } else if (opt.hairStyle === 'full_bob_bangs') {
    backHairPath = `
      <path d="M 48 75 Q 100 30 152 75 L 158 145 Q 135 140 130 110 Q 100 85 70 110 Q 65 140 42 145 Z" fill="${hairC}" />
    `;
    frontHairPath = `
      <path d="M 52 80 Q 56 42 100 42 Q 144 42 148 80 Q 100 78 52 80 Z" fill="${hairC}" />
      <path d="M 62 80 L 62 92 M 75 80 L 75 94 M 88 80 L 88 95 M 100 80 L 100 95 M 112 80 L 112 95 M 125 80 L 125 94 M 138 80 L 138 92" stroke="${hairC}" stroke-width="3" />
    `;
  } else if (opt.hairStyle === 'full_ponytail') {
    backHairPath = `
      <circle cx="138" cy="42" r="22" fill="${hairC}" />
      <path d="M 138 42 Q 175 58 162 115 Q 145 95 138 58 Z" fill="${hairC}" />
      <circle cx="134" cy="50" r="5" fill="${clothC}" />
    `;
    frontHairPath = `
      <path d="M 56 85 Q 58 42 100 42 Q 142 42 144 85 Q 125 76 100 76 Q 75 76 56 85 Z" fill="${hairC}" />
    `;
  } else if (opt.hairStyle === 'hijab') {
    frontHairPath = `
      <path d="M 45 75 Q 100 25 155 75 Q 165 120 160 178 Q 100 192 40 178 Q 35 120 45 75 Z" fill="${clothC}" />
      <path d="M 60 85 Q 100 58 140 85 Q 145 130 100 135 Q 55 130 60 85 Z" fill="${skin}" />
    `;
  } else if (opt.hairStyle === 'beanie_cap') {
    frontHairPath = `
      <path d="M 48 85 Q 100 15 152 85 Z" fill="${clothC}" />
      <rect x="44" y="74" width="112" height="16" rx="6" fill="#FFFFFF" opacity="0.9" />
      <circle cx="100" cy="18" r="9" fill="#FFFFFF" />
    `;
  } else {
    // default
    frontHairPath = `<path d="M 58 85 Q 60 48 100 48 Q 140 48 142 85 Q 128 78 100 78 Q 72 78 58 85 Z" fill="${hairC}" />`;
  }

  // Glasses
  let glassesSvg = '';
  if (opt.glasses === 'classic') {
    glassesSvg = `
      <circle cx="80" cy="102" r="13" fill="none" stroke="#1E293B" stroke-width="3.5" />
      <circle cx="120" cy="102" r="13" fill="none" stroke="#1E293B" stroke-width="3.5" />
      <line x1="93" y1="102" x2="107" y2="102" stroke="#1E293B" stroke-width="3.5" />
    `;
  } else if (opt.glasses === 'cool_shades') {
    glassesSvg = `
      <path d="M 66 94 Q 80 94 92 98 Q 92 112 78 112 Q 66 112 66 94 Z" fill="#0F172A" />
      <path d="M 108 98 Q 120 94 134 94 Q 134 112 122 112 Q 108 112 108 98 Z" fill="#0F172A" />
      <line x1="92" y1="98" x2="108" y2="98" stroke="#0F172A" stroke-width="4" />
      <path d="M 70 97 L 85 105" stroke="#FFFFFF" stroke-width="2" opacity="0.6" stroke-linecap="round" />
      <path d="M 112 97 L 127 105" stroke="#FFFFFF" stroke-width="2" opacity="0.6" stroke-linecap="round" />
    `;
  } else if (opt.glasses === 'square_frames') {
    glassesSvg = `
      <rect x="67" y="93" width="26" height="20" rx="4" fill="none" stroke="#334155" stroke-width="3" />
      <rect x="107" y="93" width="26" height="20" rx="4" fill="none" stroke="#334155" stroke-width="3" />
      <line x1="93" y1="100" x2="107" y2="100" stroke="#334155" stroke-width="3" />
    `;
  }

  // Mouth
  let mouthSvg = `<path d="M 88 126 Q 100 138 112 126" stroke="#475569" stroke-width="3.5" stroke-linecap="round" fill="none" />`;
  if (opt.mouthType === 'grin') {
    mouthSvg = `<path d="M 85 124 Q 100 142 115 124 Z" fill="#E11D48" stroke="#9F1239" stroke-width="2" />`;
  } else if (opt.mouthType === 'wink_smile') {
    mouthSvg = `<path d="M 86 125 Q 100 138 114 125 Q 100 130 86 125 Z" fill="#FFFFFF" stroke="#475569" stroke-width="2" />`;
  }

  // Eyes
  let eyesSvg = `
    <circle cx="80" cy="102" r="5" fill="#1E293B" />
    <circle cx="120" cy="102" r="5" fill="#1E293B" />
    <circle cx="82" cy="100" r="1.5" fill="#FFFFFF" />
    <circle cx="122" cy="100" r="1.5" fill="#FFFFFF" />
  `;
  if (opt.eyeType === 'wink') {
    eyesSvg = `
      <path d="M 74 102 Q 80 96 86 102" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none" />
      <circle cx="120" cy="102" r="5" fill="#1E293B" />
      <circle cx="122" cy="100" r="1.5" fill="#FFFFFF" />
    `;
  } else if (opt.eyeType === 'anime') {
    eyesSvg = `
      <ellipse cx="80" cy="102" rx="6" ry="8" fill="#1E293B" />
      <ellipse cx="120" cy="102" rx="6" ry="8" fill="#1E293B" />
      <circle cx="82" cy="99" r="2.5" fill="#FFFFFF" />
      <circle cx="122" cy="99" r="2.5" fill="#FFFFFF" />
    `;
  }

  // Clothes
  let clothingSvg = '';
  if (opt.clothing === 'hoodie') {
    clothingSvg = `
      <path d="M 40 160 Q 100 145 160 160 L 170 200 L 30 200 Z" fill="${clothC}" />
      <path d="M 85 160 L 100 185 L 115 160" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.8" />
      <path d="M 92 185 L 92 198" stroke="#FFFFFF" stroke-width="2" />
      <path d="M 108 185 L 108 198" stroke="#FFFFFF" stroke-width="2" />
    `;
  } else if (opt.clothing === 'varsity') {
    clothingSvg = `
      <path d="M 40 160 Q 100 145 160 160 L 170 200 L 30 200 Z" fill="${clothC}" />
      <path d="M 75 160 L 100 200 L 125 160" fill="#FFFFFF" />
      <circle cx="100" cy="178" r="3" fill="#1E293B" />
      <circle cx="100" cy="192" r="3" fill="#1E293B" />
    `;
  } else {
    // Casual Tee / Jacket
    clothingSvg = `
      <path d="M 42 162 Q 100 148 158 162 L 168 200 L 32 200 Z" fill="${clothC}" />
      <path d="M 80 162 Q 100 178 120 162" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.6" />
    `;
  }

  // Accessories (Headphones)
  let accessorySvg = '';
  if (opt.accessory === 'headphones') {
    accessorySvg = `
      <path d="M 52 105 Q 100 35 148 105" fill="none" stroke="#0F172A" stroke-width="6" stroke-linecap="round" />
      <rect x="42" y="92" width="14" height="26" rx="6" fill="#3B82F6" />
      <rect x="144" y="92" width="14" height="26" rx="6" fill="#3B82F6" />
    `;
  } else if (opt.accessory === 'earrings') {
    accessorySvg = `
      <circle cx="56" cy="118" r="4" fill="none" stroke="#F59E0B" stroke-width="2" />
      <circle cx="144" cy="118" r="4" fill="none" stroke="#F59E0B" stroke-width="2" />
    `;
  }

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bg.color}" />
          <stop offset="100%" stop-color="${bg.secondary}" />
        </linearGradient>
      </defs>

      <!-- Background Circle -->
      <rect width="200" height="200" rx="40" fill="url(#bgGrad)" />

      <!-- Back Hair (Flows behind shoulders / head) -->
      ${backHairPath}

      <!-- Body / Outfit -->
      ${clothingSvg}

      <!-- Neck -->
      <rect x="88" y="140" width="24" height="22" rx="6" fill="${skin}" />

      <!-- Head Base -->
      <path d="M 60 90 Q 60 55 100 55 Q 140 55 140 90 Q 140 142 100 142 Q 60 142 60 90 Z" fill="${skin}" />

      <!-- Ears -->
      <circle cx="58" cy="105" r="7" fill="${skin}" />
      <circle cx="142" cy="105" r="7" fill="${skin}" />

      <!-- Front Hair (Top of head, bangs, short styles, cap/hijab) -->
      ${frontHairPath}

      <!-- Facial Features -->
      ${eyesSvg}
      ${mouthSvg}
      ${glassesSvg}

      <!-- Accessories -->
      ${accessorySvg}
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
};

export const AvatarCreatorModal: React.FC<AvatarCreatorModalProps> = ({
  isOpen,
  onClose,
  onSaveAvatar,
  initialGender = 'male',
}) => {
  const [activeTab, setActiveTab] = useState<'gender' | 'hair' | 'face' | 'clothes' | 'bg'>('gender');
  const [hairCategoryFilter, setHairCategoryFilter] = useState<'all' | 'short' | 'full'>('all');

  const [options, setOptions] = useState<AvatarOptions>({
    gender: initialGender,
    skinTone: SKIN_TONES[1].color,
    hairStyle: initialGender === 'female' ? 'full_long_straight' : 'short_spikes',
    hairColor: HAIR_COLORS[0].color,
    eyeType: 'happy',
    eyeColor: '#1E293B',
    mouthType: 'grin',
    facialHair: 'none',
    glasses: 'none',
    clothing: 'hoodie',
    clothingColor: CLOTHING_COLORS[0].color,
    accessory: 'none',
    bgType: 'gradient',
    bgColor: BG_COLORS[0].color,
  });

  if (!isOpen) return null;

  const currentSvgDataUri = generateCartoonSvg(options);

  const handleRandomize = () => {
    const randomGender = Math.random() > 0.5 ? 'male' : 'female';
    const availableStyles = HAIR_STYLES.filter((h) => h.gender === randomGender || h.gender === 'unisex');
    const randomHair = availableStyles[Math.floor(Math.random() * availableStyles.length)];
    const randomSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
    const randomHairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
    const randomOutfit = OUTFITS[Math.floor(Math.random() * OUTFITS.length)];
    const randomOutfitColor = CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)];
    const randomBg = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
    const randomGlasses = GLASSES_OPTIONS[Math.floor(Math.random() * GLASSES_OPTIONS.length)];

    setOptions({
      ...options,
      gender: randomGender,
      hairStyle: randomHair.id,
      skinTone: randomSkin.color,
      hairColor: randomHairColor.color,
      clothing: randomOutfit.id,
      clothingColor: randomOutfitColor.color,
      bgColor: randomBg.color,
      glasses: randomGlasses.id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-6 h-6 text-amber-500 animate-bounce" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Snapchat Cartoon Avatar Studio
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create & customize your personal campus cartoon bitmoji avatar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomize}
              className="px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 rounded-xl hover:bg-amber-100 flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Randomize Avatar
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Avatar Live Display + Customization Controls */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-6 overflow-y-auto">
          
          {/* LEFT: LIVE CARTOON PREVIEW CARD */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-inner space-y-4">
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl overflow-hidden shadow-xl ring-4 ring-indigo-500/30 transform hover:scale-105 transition-all">
              <img src={currentSvgDataUri} alt="Cartoon Avatar" className="w-full h-full object-cover" />
            </div>

            <div className="text-center space-y-1">
              <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-black uppercase tracking-wider">
                ✨ Campus Cartoon Bitmoji
              </span>
              <p className="text-[11px] text-slate-400">
                Renders instantly as crisp vector graphics
              </p>
            </div>

            <button
              onClick={() => {
                onSaveAvatar(currentSvgDataUri);
                onClose();
              }}
              className="w-full py-3 px-4 font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" /> Save This Cartoon Avatar
            </button>
          </div>

          {/* RIGHT: TABS & EDITOR PANEL */}
          <div className="sm:col-span-7 flex flex-col space-y-4">
            
            {/* Category Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs overflow-x-auto">
              <button
                onClick={() => setActiveTab('gender')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'gender'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Base
              </button>
              <button
                onClick={() => setActiveTab('hair')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'hair'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" /> Hair
              </button>
              <button
                onClick={() => setActiveTab('face')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'face'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Glasses className="w-3.5 h-3.5" /> Specs
              </button>
              <button
                onClick={() => setActiveTab('clothes')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'clothes'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" /> Outfit
              </button>
              <button
                onClick={() => setActiveTab('bg')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'bg'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5" /> BG
              </button>
            </div>

            {/* TAB CONTENT PANELS */}
            <div className="space-y-4 text-xs">
              
              {/* TAB 1: GENDER & SKIN */}
              {activeTab === 'gender' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Gender / Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setOptions({
                            ...options,
                            gender: 'male',
                            hairStyle: 'messy_spikes',
                          });
                        }}
                        className={`p-3 rounded-xl border text-center font-bold transition-all ${
                          options.gender === 'male'
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        ♂ Male Student
                      </button>
                      <button
                        onClick={() => {
                          setOptions({
                            ...options,
                            gender: 'female',
                            hairStyle: 'long_straight',
                          });
                        }}
                        className={`p-3 rounded-xl border text-center font-bold transition-all ${
                          options.gender === 'female'
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        ♀ Female Student
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Skin Complexion
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {SKIN_TONES.map((st) => (
                        <button
                          key={st.name}
                          onClick={() => setOptions({ ...options, skinTone: st.color })}
                          className={`w-10 h-10 rounded-full flex-shrink-0 ring-2 transition-transform ${
                            options.skinTone === st.color
                              ? 'ring-indigo-600 scale-110 shadow-md'
                              : 'ring-transparent'
                          }`}
                          style={{ backgroundColor: st.color }}
                          title={st.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: HAIR & HAIR COLOR */}
              {activeTab === 'hair' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Hairstyle
                      </label>
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-[10px]">
                        <button
                          type="button"
                          onClick={() => setHairCategoryFilter('all')}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                            hairCategoryFilter === 'all'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          All Styles
                        </button>
                        <button
                          type="button"
                          onClick={() => setHairCategoryFilter('short')}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                            hairCategoryFilter === 'short'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          ✂️ Short Hair
                        </button>
                        <button
                          type="button"
                          onClick={() => setHairCategoryFilter('full')}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                            hairCategoryFilter === 'full'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          💇 Full Hair
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {HAIR_STYLES.filter(
                        (h) =>
                          (h.gender === options.gender || h.gender === 'unisex') &&
                          (hairCategoryFilter === 'all' || h.category === hairCategoryFilter)
                      ).map((hs) => (
                        <button
                          key={hs.id}
                          onClick={() => setOptions({ ...options, hairStyle: hs.id })}
                          className={`p-2.5 rounded-xl border text-left font-bold transition-all flex items-center justify-between ${
                            options.hairStyle === hs.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                          }`}
                        >
                          <span>{hs.name}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-black opacity-60 bg-slate-100 dark:bg-slate-700">
                            {hs.category === 'short' ? 'Short' : 'Full'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Hair Color
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {HAIR_COLORS.map((hc) => (
                        <button
                          key={hc.name}
                          onClick={() => setOptions({ ...options, hairColor: hc.color })}
                          className={`w-9 h-9 rounded-full flex-shrink-0 ring-2 transition-transform ${
                            options.hairColor === hc.color
                              ? 'ring-indigo-600 scale-110 shadow-md'
                              : 'ring-transparent'
                          }`}
                          style={{ backgroundColor: hc.color }}
                          title={hc.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GLASSES & EXPRESSION */}
              {activeTab === 'face' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Glasses & Eyewear
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {GLASSES_OPTIONS.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setOptions({ ...options, glasses: g.id })}
                          className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                            options.glasses === g.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Facial Expression / Smile
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOptions({ ...options, mouthType: 'grin' })}
                        className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                          options.mouthType === 'grin'
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        😁 Big Happy Grin
                      </button>
                      <button
                        onClick={() => setOptions({ ...options, mouthType: 'wink_smile' })}
                        className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                          options.mouthType === 'wink_smile'
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        😊 Chill Smile
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: OUTFIT & COLOR */}
              {activeTab === 'clothes' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Campus Outfit
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {OUTFITS.map((o) => (
                        <button
                          key={o.id}
                          onClick={() => setOptions({ ...options, clothing: o.id })}
                          className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                            options.clothing === o.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                          }`}
                        >
                          {o.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Outfit Color
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {CLOTHING_COLORS.map((cc) => (
                        <button
                          key={cc.name}
                          onClick={() => setOptions({ ...options, clothingColor: cc.color })}
                          className={`w-9 h-9 rounded-full flex-shrink-0 ring-2 transition-transform ${
                            options.clothingColor === cc.color
                              ? 'ring-indigo-600 scale-110 shadow-md'
                              : 'ring-transparent'
                          }`}
                          style={{ backgroundColor: cc.color }}
                          title={cc.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: BACKGROUND & EXTRAS */}
              {activeTab === 'bg' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Background Theme
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {BG_COLORS.map((bg) => (
                        <button
                          key={bg.name}
                          onClick={() => setOptions({ ...options, bgColor: bg.color })}
                          className={`p-3 rounded-xl border text-left font-bold text-white flex items-center justify-between transition-all ${
                            options.bgColor === bg.color ? 'ring-2 ring-indigo-500 scale-102' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{
                            background: `linear-gradient(135deg, ${bg.color}, ${bg.secondary})`,
                          }}
                        >
                          <span>{bg.name}</span>
                          {options.bgColor === bg.color && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Accessories
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ACCESSORIES.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => setOptions({ ...options, accessory: acc.id })}
                          className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                            options.accessory === acc.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                          }`}
                        >
                          {acc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
